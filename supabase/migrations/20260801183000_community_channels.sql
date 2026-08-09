begin;

create table public.community_channels (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.community_circles(id) on delete cascade,
  name text not null check (name ~ '^[a-z0-9-]{2,40}$'),
  category text not null check (category in ('start','announcements','community','study','showcase')),
  channel_kind text not null default 'chat' check (channel_kind in ('chat','forum','read_only')),
  description text not null default '' check (char_length(description) <= 240),
  position smallint not null default 0,
  slowmode_seconds smallint not null default 10 check (slowmode_seconds between 0 and 3600),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(circle_id,name)
);

alter table public.community_posts
  add column channel_id uuid references public.community_channels(id) on delete cascade,
  add column parent_post_id uuid references public.community_posts(id) on delete cascade;

create table public.community_profile_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text not null default '' check (char_length(bio) <= 280),
  interests text[] not null default '{}',
  specialties text[] not null default '{}',
  reputation integer not null default 0 check (reputation >= 0),
  badge text check (badge is null or badge in ('active_member','monthly_helper','content_creator')),
  updated_at timestamptz not null default now(),
  check (cardinality(interests) <= 12 and cardinality(specialties) <= 12)
);

create index community_channels_circle_idx on public.community_channels(circle_id,category,position);
create index community_posts_channel_idx on public.community_posts(channel_id,created_at desc);
create index community_posts_parent_idx on public.community_posts(parent_post_id,created_at);

create trigger community_profile_details_set_updated_at before update on public.community_profile_details
for each row execute function public.set_updated_at();

create or replace function public.seed_community_channels()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.community_channels(circle_id,name,category,channel_kind,description,position,slowmode_seconds,created_by)
  values
    (new.id,'boas-vindas','start','read_only','Regras, propósito e primeiros passos.',10,0,new.owner_id),
    (new.id,'avisos','announcements','read_only','Atualizações oficiais do círculo.',20,0,new.owner_id),
    (new.id,'bate-papo-geral','community','chat','Conversa respeitosa e comunhão.',30,10,new.owner_id),
    (new.id,'duvidas-biblicas','study','forum','Perguntas organizadas em tópicos.',40,20,new.owner_id),
    (new.id,'estudos-e-esbocos','study','forum','Estudos, anotações e esboços.',50,30,new.owner_id),
    (new.id,'conquistas','showcase','forum','Marcos de aprendizagem e testemunhos.',60,30,new.owner_id);
  return new;
end $$;

create trigger community_circle_seed_channels after insert on public.community_circles
for each row execute function public.seed_community_channels();

insert into public.community_channels(circle_id,name,category,channel_kind,description,position,slowmode_seconds,created_by)
select c.id,v.name,v.category,v.kind,v.description,v.position,v.slowmode,c.owner_id
from public.community_circles c cross join (values
  ('boas-vindas','start','read_only','Regras, propósito e primeiros passos.',10,0),
  ('avisos','announcements','read_only','Atualizações oficiais do círculo.',20,0),
  ('bate-papo-geral','community','chat','Conversa respeitosa e comunhão.',30,10),
  ('duvidas-biblicas','study','forum','Perguntas organizadas em tópicos.',40,20),
  ('estudos-e-esbocos','study','forum','Estudos, anotações e esboços.',50,30),
  ('conquistas','showcase','forum','Marcos de aprendizagem e testemunhos.',60,30)
) as v(name,category,kind,description,position,slowmode)
on conflict(circle_id,name) do nothing;

update public.community_posts p set channel_id=(
  select ch.id from public.community_channels ch
  where ch.circle_id=p.circle_id and ch.name='bate-papo-geral'
) where p.channel_id is null;

create or replace function public.enforce_community_channel_posting()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_channel public.community_channels; v_role text;
begin
  if new.channel_id is null then
    select id into new.channel_id from public.community_channels
      where circle_id=new.circle_id and name='bate-papo-geral';
  end if;
  select * into v_channel from public.community_channels where id=new.channel_id and circle_id=new.circle_id;
  if v_channel.id is null then raise exception 'invalid channel'; end if;
  select role into v_role from public.community_circle_members
    where circle_id=new.circle_id and user_id=new.author_id and status='active';
  if v_role is null then raise exception 'active membership required'; end if;
  if v_channel.channel_kind='read_only' and v_role not in ('owner','moderator')
    then raise exception 'read-only channel'; end if;
  if v_channel.slowmode_seconds > 0 and exists(
    select 1 from public.community_posts p where p.channel_id=new.channel_id
      and p.author_id=new.author_id
      and p.created_at > now()-make_interval(secs=>v_channel.slowmode_seconds)
  ) then raise exception 'slowmode active'; end if;
  if new.parent_post_id is not null and not exists(
    select 1 from public.community_posts p where p.id=new.parent_post_id
      and p.channel_id=new.channel_id and p.parent_post_id is null
  ) then raise exception 'invalid thread parent'; end if;
  return new;
end $$;

create trigger community_posts_channel_guard before insert on public.community_posts
for each row execute function public.enforce_community_channel_posting();

alter table public.community_channels enable row level security;
alter table public.community_channels force row level security;
alter table public.community_profile_details enable row level security;
alter table public.community_profile_details force row level security;

create policy channels_read on public.community_channels for select to authenticated
using (public.is_active_circle_member(circle_id,(select auth.uid())));
create policy channels_create on public.community_channels for insert to authenticated
with check (created_by=(select auth.uid()) and public.is_circle_moderator(circle_id,(select auth.uid())));
create policy channels_manage on public.community_channels for update to authenticated
using (public.is_circle_moderator(circle_id,(select auth.uid())))
with check (public.is_circle_moderator(circle_id,(select auth.uid())));
create policy channels_delete on public.community_channels for delete to authenticated
using (public.is_circle_moderator(circle_id,(select auth.uid())));

create policy community_profile_details_read on public.community_profile_details for select to authenticated using (true);
create policy community_profile_details_own on public.community_profile_details for all to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

revoke all on public.community_channels,public.community_profile_details from anon,authenticated;
grant select,insert,update,delete on public.community_channels to authenticated;
grant select,insert,update,delete on public.community_profile_details to authenticated;
revoke all on function public.seed_community_channels() from public;
revoke all on function public.enforce_community_channel_posting() from public;

commit;

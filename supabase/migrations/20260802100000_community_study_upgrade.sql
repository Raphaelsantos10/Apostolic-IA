begin;

alter table public.community_profile_details
  add column if not exists enrolled_courses text[] not null default '{}';

alter table public.community_profile_details drop constraint if exists community_profile_details_enrolled_courses_check;
alter table public.community_profile_details add constraint community_profile_details_enrolled_courses_check
  check (cardinality(enrolled_courses) <= 12);

create table if not exists public.community_post_reactions (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('amen','thanks','helpful','pray','heart')),
  created_at timestamptz not null default now(),
  primary key(post_id,user_id,reaction)
);

create table if not exists public.community_study_rooms (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.community_circles(id) on delete cascade,
  channel_id uuid references public.community_channels(id) on delete set null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  room_mode text not null check (room_mode in ('audio','video')),
  status text not null default 'scheduled' check (status in ('scheduled','live','ended')),
  starts_at timestamptz not null,
  external_url text check (external_url is null or external_url ~ '^https://'),
  max_participants smallint not null default 12 check (max_participants between 2 and 50),
  created_at timestamptz not null default now()
);

create index if not exists community_reactions_post_idx on public.community_post_reactions(post_id);
create index if not exists community_rooms_circle_idx on public.community_study_rooms(circle_id,starts_at);

create or replace function public.seed_community_channels()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.community_channels(circle_id,name,category,channel_kind,description,position,slowmode_seconds,created_by)
  values
    (new.id,'boas-vindas-e-regras','start','read_only','Propósito, amor, respeito e foco no estudo.',10,0,new.owner_id),
    (new.id,'avisos-e-cronograma','announcements','read_only','Aulas, transmissões e prazos dos cursos.',20,0,new.owner_id),
    (new.id,'curso-panorama-biblico','study','forum','Contexto geral dos livros da Bíblia.',30,20,new.owner_id),
    (new.id,'curso-hermeneutica-e-interpretacao','study','forum','Interpretação responsável de textos e passagens.',40,20,new.owner_id),
    (new.id,'curso-historia-da-igreja','study','forum','Discussões dos módulos de história da Igreja.',50,20,new.owner_id),
    (new.id,'duvidas-gerais-de-estudo','study','forum','Perguntas que ainda não têm um canal específico.',60,20,new.owner_id),
    (new.id,'pedidos-de-oracao','community','forum','Pedidos e apoio mútuo com cuidado e privacidade.',70,30,new.owner_id),
    (new.id,'devocional-diario','community','chat','Versículos, reflexões e aprendizados do dia.',80,15,new.owner_id);
  return new;
end $$;

insert into public.community_channels(circle_id,name,category,channel_kind,description,position,slowmode_seconds,created_by)
select c.id,v.name,v.category,v.kind,v.description,v.position,v.slowmode,c.owner_id
from public.community_circles c cross join (values
  ('boas-vindas-e-regras','start','read_only','Propósito, amor, respeito e foco no estudo.',10,0),
  ('avisos-e-cronograma','announcements','read_only','Aulas, transmissões e prazos dos cursos.',20,0),
  ('curso-panorama-biblico','study','forum','Contexto geral dos livros da Bíblia.',30,20),
  ('curso-hermeneutica-e-interpretacao','study','forum','Interpretação responsável de textos e passagens.',40,20),
  ('curso-historia-da-igreja','study','forum','Discussões dos módulos de história da Igreja.',50,20),
  ('duvidas-gerais-de-estudo','study','forum','Perguntas que ainda não têm um canal específico.',60,20),
  ('pedidos-de-oracao','community','forum','Pedidos e apoio mútuo com cuidado e privacidade.',70,30),
  ('devocional-diario','community','chat','Versículos, reflexões e aprendizados do dia.',80,15)
) as v(name,category,kind,description,position,slowmode)
on conflict(circle_id,name) do nothing;

create or replace function public.create_community_circle(
  p_name text, p_description text default '', p_visibility text default 'private'
) returns public.community_circles language plpgsql security definer set search_path=''
as $$
declare v_user uuid := auth.uid(); v_circle public.community_circles;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if char_length(trim(p_name)) not between 3 and 80 then raise exception 'invalid circle name'; end if;
  if p_visibility not in ('public','private') then raise exception 'invalid visibility'; end if;
  insert into public.community_circles(owner_id,name,description,visibility)
  values(v_user,trim(p_name),left(trim(coalesce(p_description,'')),500),p_visibility)
  returning * into v_circle;
  insert into public.community_circle_members(circle_id,user_id,role,status)
  values(v_circle.id,v_user,'owner','active');
  return v_circle;
end $$;

create or replace function public.toggle_community_reaction(p_post_id uuid,p_reaction text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_user uuid := auth.uid(); v_circle uuid;
begin
  if p_reaction not in ('amen','thanks','helpful','pray','heart') then raise exception 'invalid reaction'; end if;
  select circle_id into v_circle from public.community_posts where id=p_post_id;
  if v_circle is null or not public.is_active_circle_member(v_circle,v_user) then raise exception 'active membership required'; end if;
  if exists(select 1 from public.community_post_reactions where post_id=p_post_id and user_id=v_user and reaction=p_reaction) then
    delete from public.community_post_reactions where post_id=p_post_id and user_id=v_user and reaction=p_reaction;
    return false;
  end if;
  insert into public.community_post_reactions(post_id,user_id,reaction) values(p_post_id,v_user,p_reaction);
  return true;
end $$;

alter table public.community_post_reactions enable row level security;
alter table public.community_post_reactions force row level security;
alter table public.community_study_rooms enable row level security;
alter table public.community_study_rooms force row level security;

create policy reactions_read on public.community_post_reactions for select to authenticated using (
  exists(select 1 from public.community_posts p where p.id=post_id and public.is_active_circle_member(p.circle_id,(select auth.uid())))
);
create policy reactions_own_delete on public.community_post_reactions for delete to authenticated using (user_id=(select auth.uid()));
create policy rooms_read on public.community_study_rooms for select to authenticated using (public.is_active_circle_member(circle_id,(select auth.uid())));
create policy rooms_create on public.community_study_rooms for insert to authenticated with check (host_id=(select auth.uid()) and public.is_active_circle_member(circle_id,(select auth.uid())));
create policy rooms_manage on public.community_study_rooms for update to authenticated using (host_id=(select auth.uid()) or public.is_circle_moderator(circle_id,(select auth.uid()))) with check (host_id=(select auth.uid()) or public.is_circle_moderator(circle_id,(select auth.uid())));

revoke all on public.community_post_reactions,public.community_study_rooms from anon,authenticated;
grant select,delete on public.community_post_reactions to authenticated;
grant select,insert,update on public.community_study_rooms to authenticated;
revoke all on function public.create_community_circle(text,text,text),public.toggle_community_reaction(uuid,text) from public;
grant execute on function public.create_community_circle(text,text,text),public.toggle_community_reaction(uuid,text) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_posts') then
    alter publication supabase_realtime add table public.community_posts;
  end if;
end $$;

commit;

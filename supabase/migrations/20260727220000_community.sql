begin;

create table public.community_circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 3 and 80),
  description text not null default '' check (char_length(description) <= 500),
  visibility text not null default 'private' check (visibility in ('public','private')),
  created_at timestamptz not null default now()
);

create table public.community_circle_members (
  circle_id uuid not null references public.community_circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','moderator','member')),
  status text not null default 'active' check (status in ('active','blocked')),
  joined_at timestamptz not null default now(),
  primary key (circle_id,user_id)
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.community_circles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  moderation_status text not null default 'visible'
    check (moderation_status in ('visible','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 800),
  moderation_status text not null default 'visible'
    check (moderation_status in ('visible','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  circle_id uuid not null references public.community_circles(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reason text not null check (reason in ('spam','harassment','hate','misinformation','other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(post_id,comment_id)=1),
  unique nulls not distinct (reporter_id,post_id,comment_id)
);

create table public.community_moderation_actions (
  id bigint generated always as identity primary key,
  circle_id uuid not null references public.community_circles(id) on delete cascade,
  moderator_id uuid not null references public.profiles(id) on delete cascade,
  report_id bigint references public.community_reports(id) on delete set null,
  target_kind text not null check (target_kind in ('post','comment','member')),
  target_id text not null,
  action text not null check (action in ('hide','restore','remove','block','unblock','dismiss')),
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  created_at timestamptz not null default now()
);

create table public.community_league_opt_ins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  opted_in boolean not null default false,
  display_name text check (display_name is null or char_length(trim(display_name)) between 2 and 40),
  updated_at timestamptz not null default now()
);

create index community_members_user_idx on public.community_circle_members(user_id,status);
create index community_posts_circle_idx on public.community_posts(circle_id,created_at desc);
create index community_comments_post_idx on public.community_comments(post_id,created_at);
create index community_reports_queue_idx on public.community_reports(circle_id,status,created_at);

create trigger community_posts_set_updated_at before update on public.community_posts
for each row execute function public.set_updated_at();
create trigger community_comments_set_updated_at before update on public.community_comments
for each row execute function public.set_updated_at();
create trigger community_league_opt_ins_set_updated_at before update on public.community_league_opt_ins
for each row execute function public.set_updated_at();

create or replace function public.is_active_circle_member(p_circle_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists (
  select 1 from public.community_circle_members m
  where m.circle_id=p_circle_id and m.user_id=p_user_id and m.status='active'
) $$;

create or replace function public.is_circle_moderator(p_circle_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists (
  select 1 from public.community_circle_members m
  where m.circle_id=p_circle_id and m.user_id=p_user_id
    and m.status='active' and m.role in ('owner','moderator')
) $$;

create or replace function public.community_rate_limit(p_kind text, p_user_id uuid)
returns boolean language plpgsql stable security definer set search_path=''
as $$
begin
  if p_kind='post' then
    return (select count(*) < 5 from public.community_posts
      where author_id=p_user_id and created_at > now()-interval '10 minutes');
  elsif p_kind='comment' then
    return (select count(*) < 15 from public.community_comments
      where author_id=p_user_id and created_at > now()-interval '10 minutes');
  end if;
  return false;
end $$;

create or replace function public.join_public_circle(p_circle_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if not exists(select 1 from public.community_circles where id=p_circle_id and visibility='public')
    then raise exception 'circle is not public'; end if;
  insert into public.community_circle_members(circle_id,user_id)
  values(p_circle_id,v_user)
  on conflict(circle_id,user_id) do update set status='active',role='member';
end $$;

create or replace function public.moderate_community_content(
  p_report_id bigint, p_action text, p_reason text
) returns void language plpgsql security definer set search_path=''
as $$
declare v_user uuid := (select auth.uid()); v_report public.community_reports;
begin
  select * into v_report from public.community_reports where id=p_report_id;
  if v_report.id is null or not public.is_circle_moderator(v_report.circle_id,v_user)
    then raise exception 'moderator access required'; end if;
  if p_action not in ('hide','restore','remove','dismiss') then raise exception 'invalid action'; end if;
  if v_report.post_id is not null and p_action<>'dismiss' then
    update public.community_posts set moderation_status=
      case p_action when 'hide' then 'hidden' when 'restore' then 'visible' else 'removed' end
      where id=v_report.post_id;
  elsif v_report.comment_id is not null and p_action<>'dismiss' then
    update public.community_comments set moderation_status=
      case p_action when 'hide' then 'hidden' when 'restore' then 'visible' else 'removed' end
      where id=v_report.comment_id;
  end if;
  update public.community_reports set status=case when p_action='dismiss' then 'dismissed' else 'resolved' end,
    reviewed_by=v_user,reviewed_at=now() where id=p_report_id;
  insert into public.community_moderation_actions(
    circle_id,moderator_id,report_id,target_kind,target_id,action,reason
  ) values(v_report.circle_id,v_user,p_report_id,
    case when v_report.post_id is not null then 'post' else 'comment' end,
    coalesce(v_report.post_id,v_report.comment_id)::text,p_action,p_reason);
end $$;

alter table public.community_circles enable row level security;
alter table public.community_circle_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_moderation_actions enable row level security;
alter table public.community_league_opt_ins enable row level security;
alter table public.community_circles force row level security;
alter table public.community_circle_members force row level security;
alter table public.community_posts force row level security;
alter table public.community_comments force row level security;
alter table public.community_reports force row level security;
alter table public.community_moderation_actions force row level security;
alter table public.community_league_opt_ins force row level security;

create policy circles_read on public.community_circles for select to authenticated
using (visibility='public' or owner_id=(select auth.uid())
  or public.is_active_circle_member(id,(select auth.uid())));
create policy circles_create on public.community_circles for insert to authenticated
with check (owner_id=(select auth.uid()));
create policy circles_owner_update on public.community_circles for update to authenticated
using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));

create policy members_read on public.community_circle_members for select to authenticated
using (user_id=(select auth.uid()) or public.is_active_circle_member(circle_id,(select auth.uid())));
create policy members_owner_seed on public.community_circle_members for insert to authenticated
with check (user_id=(select auth.uid()) and role='owner' and exists(
  select 1 from public.community_circles c where c.id=circle_id and c.owner_id=(select auth.uid())
));
create policy members_leave on public.community_circle_members for delete to authenticated
using (user_id=(select auth.uid()) and role<>'owner');

create policy posts_read on public.community_posts for select to authenticated
using (public.is_active_circle_member(circle_id,(select auth.uid()))
  and (moderation_status='visible' or author_id=(select auth.uid())
    or public.is_circle_moderator(circle_id,(select auth.uid()))));
create policy posts_create on public.community_posts for insert to authenticated
with check (author_id=(select auth.uid()) and public.is_active_circle_member(circle_id,(select auth.uid()))
  and public.community_rate_limit('post',(select auth.uid())));
create policy posts_author_update on public.community_posts for update to authenticated
using (author_id=(select auth.uid()) and moderation_status='visible')
with check (author_id=(select auth.uid()) and moderation_status='visible');
create policy posts_author_delete on public.community_posts for delete to authenticated
using (author_id=(select auth.uid()));

create policy comments_read on public.community_comments for select to authenticated
using (exists(select 1 from public.community_posts p where p.id=post_id
  and public.is_active_circle_member(p.circle_id,(select auth.uid()))
  and (community_comments.moderation_status='visible'
    or community_comments.author_id=(select auth.uid())
    or public.is_circle_moderator(p.circle_id,(select auth.uid())))));
create policy comments_create on public.community_comments for insert to authenticated
with check (author_id=(select auth.uid()) and exists(select 1 from public.community_posts p
  where p.id=post_id and p.moderation_status='visible'
  and public.is_active_circle_member(p.circle_id,(select auth.uid())))
  and public.community_rate_limit('comment',(select auth.uid())));
create policy comments_author_delete on public.community_comments for delete to authenticated
using (author_id=(select auth.uid()));

create policy reports_create on public.community_reports for insert to authenticated
with check (reporter_id=(select auth.uid())
  and public.is_active_circle_member(circle_id,(select auth.uid()))
  and (
    (post_id is not null and exists(
      select 1 from public.community_posts p where p.id=post_id and p.circle_id=circle_id
    ))
    or
    (comment_id is not null and exists(
      select 1 from public.community_comments c
      join public.community_posts p on p.id=c.post_id
      where c.id=comment_id and p.circle_id=circle_id
    ))
  ));
create policy reports_queue on public.community_reports for select to authenticated
using (reporter_id=(select auth.uid()) or public.is_circle_moderator(circle_id,(select auth.uid())));
create policy moderation_audit_read on public.community_moderation_actions for select to authenticated
using (public.is_circle_moderator(circle_id,(select auth.uid())));
create policy league_own on public.community_league_opt_ins for all to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

revoke all on public.community_circles,public.community_circle_members,
  public.community_posts,public.community_comments,public.community_reports,
  public.community_moderation_actions,public.community_league_opt_ins from anon,authenticated;
grant select,insert,update on public.community_circles to authenticated;
grant select,insert,delete on public.community_circle_members to authenticated;
grant select,insert,update,delete on public.community_posts to authenticated;
grant select,insert,delete on public.community_comments to authenticated;
grant select,insert on public.community_reports to authenticated;
grant select on public.community_moderation_actions to authenticated;
grant select,insert,update,delete on public.community_league_opt_ins to authenticated;
grant usage,select on sequence public.community_reports_id_seq to authenticated;
revoke all on function public.is_active_circle_member(uuid,uuid),
  public.is_circle_moderator(uuid,uuid),public.community_rate_limit(text,uuid),
  public.join_public_circle(uuid),public.moderate_community_content(bigint,text,text) from public;
grant execute on function public.is_active_circle_member(uuid,uuid),
  public.is_circle_moderator(uuid,uuid),public.community_rate_limit(text,uuid),
  public.join_public_circle(uuid),
  public.moderate_community_content(bigint,text,text) to authenticated;

create or replace function public.get_community_leaderboard()
returns table(user_id uuid,display_name text,learning_points integer,level smallint)
language sql stable security definer set search_path=''
as $$
  select o.user_id,o.display_name,g.learning_points,g.level
  from public.community_league_opt_ins o
  join public.gamification_profiles g on g.user_id=o.user_id
  where o.opted_in and o.display_name is not null
  order by g.learning_points desc,o.updated_at asc
  limit 100
$$;
revoke all on function public.get_community_leaderboard() from public;
grant execute on function public.get_community_leaderboard() to authenticated;

commit;

begin;

create table public.learning_point_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_kind text not null check (activity_kind in (
    'lesson_completed','quiz_correct','reading_day_completed'
  )),
  source_id text not null,
  points smallint not null check (points between 1 and 100),
  earned_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, activity_kind, source_id)
);

create table public.gamification_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  learning_points integer not null default 0 check (learning_points >= 0),
  level smallint not null default 1 check (level between 1 and 10),
  current_streak smallint not null default 0 check (current_streak >= 0),
  longest_streak smallint not null default 0 check (longest_streak >= 0),
  last_learning_date date,
  updated_at timestamptz not null default now()
);

create table public.achievement_definitions (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  description text not null,
  icon text not null,
  points_threshold integer,
  streak_threshold smallint,
  active boolean not null default true
);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievement_definitions(id),
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table public.mission_definitions (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  description text not null,
  activity_kind text not null check (activity_kind in (
    'lesson_completed','quiz_correct','reading_day_completed'
  )),
  target_count smallint not null check (target_count between 1 and 100),
  active boolean not null default true
);

create trigger gamification_profiles_set_updated_at before update on public.gamification_profiles
for each row execute function public.set_updated_at();

alter table public.learning_point_events enable row level security;
alter table public.learning_point_events force row level security;
alter table public.gamification_profiles enable row level security;
alter table public.gamification_profiles force row level security;
alter table public.achievement_definitions enable row level security;
alter table public.achievement_definitions force row level security;
alter table public.user_achievements enable row level security;
alter table public.user_achievements force row level security;
alter table public.mission_definitions enable row level security;
alter table public.mission_definitions force row level security;

create policy "point_events_select_own" on public.learning_point_events for select to authenticated
using ((select auth.uid())=user_id);
create policy "gamification_profile_select_own" on public.gamification_profiles for select to authenticated
using ((select auth.uid())=user_id);
create policy "achievement_definitions_read" on public.achievement_definitions for select to authenticated
using (active);
create policy "user_achievements_select_own" on public.user_achievements for select to authenticated
using ((select auth.uid())=user_id);
create policy "mission_definitions_read" on public.mission_definitions for select to authenticated
using (active);

revoke all on public.learning_point_events, public.gamification_profiles,
  public.achievement_definitions, public.user_achievements,
  public.mission_definitions from anon, authenticated;
grant select on public.learning_point_events, public.gamification_profiles,
  public.achievement_definitions, public.user_achievements,
  public.mission_definitions to authenticated;

create or replace function public.sync_healthy_gamification()
returns table (
  learning_points integer, level smallint, current_streak smallint,
  longest_streak smallint, last_learning_date date
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_points integer;
  v_streak smallint := 0;
  v_cursor date;
  v_last date;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;

  insert into public.learning_point_events(user_id,activity_kind,source_id,points,earned_on)
  select v_user_id,'lesson_completed',p.lesson_id::text,20,
    coalesce(p.completed_at::date,current_date)
  from public.lesson_progress p
  where p.user_id=v_user_id and p.status='completed'
  on conflict do nothing;

  insert into public.learning_point_events(user_id,activity_kind,source_id,points,earned_on)
  select v_user_id,'quiz_correct',a.id::text,10,a.answered_at::date
  from public.quiz_attempts a
  where a.user_id=v_user_id and a.is_correct
  on conflict do nothing;

  insert into public.learning_point_events(user_id,activity_kind,source_id,points,earned_on)
  select v_user_id,'reading_day_completed',p.plan_day_id::text,10,p.completed_at::date
  from public.reading_progress p where p.user_id=v_user_id
  on conflict do nothing;

  select coalesce(sum(e.points),0),max(e.earned_on)
  into v_points,v_last from public.learning_point_events e where e.user_id=v_user_id;

  v_cursor := case
    when exists(select 1 from public.learning_point_events e where e.user_id=v_user_id and e.earned_on=current_date)
      then current_date else current_date-1 end;
  while exists(select 1 from public.learning_point_events e where e.user_id=v_user_id and e.earned_on=v_cursor)
  loop
    v_streak := v_streak+1;
    v_cursor := v_cursor-1;
  end loop;

  insert into public.gamification_profiles(
    user_id,learning_points,level,current_streak,longest_streak,last_learning_date
  ) values (
    v_user_id,v_points,least(10,(v_points/100)+1)::smallint,v_streak,v_streak,v_last
  )
  on conflict(user_id) do update set
    learning_points=excluded.learning_points,
    level=excluded.level,
    current_streak=excluded.current_streak,
    longest_streak=greatest(public.gamification_profiles.longest_streak,excluded.current_streak),
    last_learning_date=excluded.last_learning_date;

  insert into public.user_achievements(user_id,achievement_id)
  select v_user_id,d.id from public.achievement_definitions d
  where d.active
    and (d.points_threshold is null or v_points>=d.points_threshold)
    and (d.streak_threshold is null or v_streak>=d.streak_threshold)
  on conflict do nothing;

  return query select g.learning_points,g.level,g.current_streak,g.longest_streak,g.last_learning_date
  from public.gamification_profiles g where g.user_id=v_user_id;
end;
$$;

revoke all on function public.sync_healthy_gamification() from public;
grant execute on function public.sync_healthy_gamification() to authenticated;

commit;

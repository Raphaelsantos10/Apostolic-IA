begin;
create type public.experience_level as enum ('beginner', 'intermediate', 'advanced');
create type public.onboarding_status as enum ('started', 'completed', 'skipped');

create table public.onboarding_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  goals text[] not null default '{}',
  experience public.experience_level not null default 'beginner',
  weekly_minutes integer not null default 60 check (weekly_minutes between 15 and 840),
  assessment_score smallint check (assessment_score between 0 and 5),
  recommended_path text,
  status public.onboarding_status not null default 'started',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger onboarding_set_updated_at before update on public.onboarding_profiles
for each row execute function public.set_updated_at();

alter table public.onboarding_profiles enable row level security;
alter table public.onboarding_profiles force row level security;
create policy "onboarding_select_own" on public.onboarding_profiles
for select to authenticated using ((select auth.uid()) = user_id);
create policy "onboarding_insert_own" on public.onboarding_profiles
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "onboarding_update_own" on public.onboarding_profiles
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
revoke all on public.onboarding_profiles from anon, authenticated;
grant select, insert, update on public.onboarding_profiles to authenticated;
commit;

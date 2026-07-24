begin;

create type public.account_status as enum ('active', 'suspended', 'deletion_requested');
create type public.app_theme as enum ('system', 'light', 'dark', 'sepia');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 2 and 80),
  locale text not null default 'pt-PT' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  timezone text not null default 'Europe/Lisbon',
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme public.app_theme not null default 'system',
  high_contrast boolean not null default false,
  text_scale smallint not null default 100 check (text_scale between 80 and 200),
  reduce_motion boolean not null default false,
  communication_email boolean not null default false,
  consent_version text,
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consent_pair check (
    (consent_version is null and consented_at is null)
    or (consent_version is not null and consented_at is not null)
  )
);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger preferences_set_updated_at
before update on public.preferences
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  );
  insert into public.preferences (user_id) values (new.id);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.preferences enable row level security;
alter table public.preferences force row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "preferences_select_own" on public.preferences
for select to authenticated using ((select auth.uid()) = user_id);

create policy "preferences_update_own" on public.preferences
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.profiles from anon, authenticated;
revoke all on public.preferences from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, locale, timezone) on public.profiles to authenticated;
grant select on public.preferences to authenticated;
grant update (
  theme, high_contrast, text_scale, reduce_motion, communication_email,
  consent_version, consented_at
) on public.preferences to authenticated;

comment on table public.profiles is
  'Perfil mínimo do utilizador; acesso limitado ao titular por RLS.';
comment on table public.preferences is
  'Preferências e consentimento versionado do próprio utilizador.';

commit;

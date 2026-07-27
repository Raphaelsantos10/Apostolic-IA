begin;

create type public.client_platform as enum ('web', 'android', 'ios');
create type public.sync_operation as enum ('upsert', 'delete');
create type public.sync_mutation_status as enum (
  'pending',
  'applied',
  'conflict',
  'rejected'
);

create table public.sync_devices (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform public.client_platform not null,
  label text check (label is null or char_length(label) between 1 and 80),
  app_version text not null check (char_length(app_version) between 1 and 32),
  locale text not null check (locale in ('pt-PT', 'pt-BR', 'es', 'en')),
  timezone text not null check (char_length(timezone) between 1 and 64),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.offline_mutations (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id uuid not null,
  client_mutation_id uuid not null,
  entity_kind text not null check (
    entity_kind in (
      'lesson_progress',
      'lesson_note',
      'lesson_favorite',
      'daily_goal',
      'verse_highlight'
    )
  ),
  entity_key text not null check (char_length(entity_key) between 1 and 200),
  operation public.sync_operation not null,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  client_changed_at timestamptz not null,
  status public.sync_mutation_status not null default 'pending',
  server_message text check (
    server_message is null or char_length(server_message) <= 1000
  ),
  received_at timestamptz not null default now(),
  applied_at timestamptz,
  unique (user_id, client_mutation_id),
  foreign key (user_id, device_id)
    references public.sync_devices(user_id, id) on delete cascade,
  constraint mutation_result_pair check (
    (status = 'applied' and applied_at is not null)
    or (status <> 'applied' and applied_at is null)
  )
);

alter table public.sync_devices enable row level security;
alter table public.sync_devices force row level security;
alter table public.offline_mutations enable row level security;
alter table public.offline_mutations force row level security;

create policy "devices_own_select" on public.sync_devices
for select to authenticated using ((select auth.uid()) = user_id);
create policy "devices_own_insert" on public.sync_devices
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "devices_own_update" on public.sync_devices
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "devices_own_delete" on public.sync_devices
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "mutations_own_select" on public.offline_mutations
for select to authenticated using ((select auth.uid()) = user_id);
create policy "mutations_own_insert" on public.offline_mutations
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and applied_at is null
);

revoke all on public.sync_devices, public.offline_mutations
  from anon, authenticated;
grant select, insert, update, delete on public.sync_devices to authenticated;
grant select, insert on public.offline_mutations to authenticated;
grant usage, select on sequence public.offline_mutations_id_seq to authenticated;

comment on table public.sync_devices is
  'Dispositivos privados autorizados para sincronização multiplataforma.';
comment on table public.offline_mutations is
  'Fila idempotente; aplicação e resolução de conflitos pertencem ao backend.';

commit;

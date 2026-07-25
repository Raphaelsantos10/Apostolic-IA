begin;

create type public.editorial_status as enum (
  'draft',
  'review',
  'approved',
  'published',
  'archived'
);

create table public.editorial_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  summary text not null check (char_length(summary) between 10 and 500),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  status public.editorial_status not null default 'draft',
  position integer not null default 0 check (position >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_publication_date check (
    (status = 'published' and published_at is not null)
    or (status <> 'published')
  )
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  summary text not null check (char_length(summary) between 10 and 500),
  status public.editorial_status not null default 'draft',
  position integer not null check (position >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  unique (course_id, position),
  constraint module_publication_date check (
    (status = 'published' and published_at is not null)
    or (status <> 'published')
  )
);

create trigger courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

create trigger course_modules_set_updated_at
before update on public.course_modules
for each row execute function public.set_updated_at();

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.editorial_members
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_editor() from public;
grant execute on function public.is_editor() to anon, authenticated;

alter table public.editorial_members enable row level security;
alter table public.editorial_members force row level security;
alter table public.courses enable row level security;
alter table public.courses force row level security;
alter table public.course_modules enable row level security;
alter table public.course_modules force row level security;

create policy "courses_read_published" on public.courses
for select to anon, authenticated
using (status = 'published' or public.is_editor());

create policy "courses_editor_insert" on public.courses
for insert to authenticated with check (public.is_editor());
create policy "courses_editor_update" on public.courses
for update to authenticated
using (public.is_editor()) with check (public.is_editor());
create policy "courses_editor_delete" on public.courses
for delete to authenticated using (public.is_editor());

create policy "modules_read_published" on public.course_modules
for select to anon, authenticated
using (
  (status = 'published' and exists (
    select 1 from public.courses
    where courses.id = course_modules.course_id
      and courses.status = 'published'
  ))
  or public.is_editor()
);

create policy "modules_editor_insert" on public.course_modules
for insert to authenticated with check (public.is_editor());
create policy "modules_editor_update" on public.course_modules
for update to authenticated
using (public.is_editor()) with check (public.is_editor());
create policy "modules_editor_delete" on public.course_modules
for delete to authenticated using (public.is_editor());

revoke all on public.editorial_members from anon, authenticated;
revoke all on public.courses from anon, authenticated;
revoke all on public.course_modules from anon, authenticated;
grant select on public.courses, public.course_modules to anon, authenticated;
grant insert, update, delete on public.courses, public.course_modules to authenticated;

comment on table public.courses is
  'Catálogo autoral; somente cursos publicados são públicos.';
comment on table public.course_modules is
  'Módulos ordenados e vinculados a cursos com controle editorial.';

commit;

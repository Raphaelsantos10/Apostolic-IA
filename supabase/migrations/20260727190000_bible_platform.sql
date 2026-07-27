begin;

create type public.bible_license_status as enum (
  'blocked', 'evaluation', 'authorized_limited', 'authorized', 'revoked'
);

create table public.bible_licenses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  rights_holder text not null,
  status public.bible_license_status not null default 'blocked',
  allows_reading boolean not null default false,
  allows_search boolean not null default false,
  allows_comparison boolean not null default false,
  allows_offline boolean not null default false,
  allows_audio boolean not null default false,
  attribution text not null,
  territories text[] not null default array[]::text[],
  valid_from date,
  valid_until date,
  evidence_reference text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authorized_reading check (
    status not in ('authorized', 'authorized_limited') or allows_reading
  ),
  constraint license_dates check (
    valid_until is null or valid_from is null or valid_until >= valid_from
  )
);

create table public.bible_versions (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.bible_licenses(id),
  code text not null unique check (code ~ '^[A-Z0-9-]{2,16}$'),
  name text not null check (char_length(name) between 3 and 120),
  language text not null check (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  edition text not null,
  is_demo boolean not null default false,
  status public.editorial_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bible_version_publication check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

create table public.bible_books (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.bible_versions(id) on delete cascade,
  canonical_order smallint not null check (canonical_order between 1 and 80),
  testament text not null check (testament in ('old', 'new')),
  name text not null,
  abbreviation text not null,
  chapter_count smallint not null check (chapter_count > 0),
  unique (version_id, canonical_order),
  unique (version_id, abbreviation)
);

create table public.bible_verses (
  id bigint generated always as identity primary key,
  book_id uuid not null references public.bible_books(id) on delete cascade,
  chapter smallint not null check (chapter > 0),
  verse smallint not null check (verse > 0),
  text text not null check (char_length(trim(text)) between 1 and 2000),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(text, ''))
  ) stored,
  unique (book_id, chapter, verse)
);

create index bible_verses_search_idx on public.bible_verses using gin (search_vector);
create index bible_verses_reference_idx on public.bible_verses (book_id, chapter, verse);

create table public.reading_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 500),
  duration_days smallint not null check (duration_days between 1 and 730),
  status public.editorial_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_plan_publication check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

create table public.reading_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.reading_plans(id) on delete cascade,
  day_number smallint not null check (day_number > 0),
  title text not null,
  reference_label text not null,
  book_id uuid references public.bible_books(id) on delete set null,
  chapter_start smallint check (chapter_start > 0),
  chapter_end smallint check (chapter_end is null or chapter_end >= chapter_start),
  unique (plan_id, day_number)
);

create table public.user_reading_plans (
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.reading_plans(id) on delete cascade,
  started_on date not null default current_date,
  target_minutes smallint not null default 10 check (target_minutes between 5 and 180),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, plan_id)
);

create table public.reading_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_day_id uuid not null references public.reading_plan_days(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, plan_day_id)
);

create trigger bible_licenses_set_updated_at before update on public.bible_licenses
for each row execute function public.set_updated_at();
create trigger bible_versions_set_updated_at before update on public.bible_versions
for each row execute function public.set_updated_at();
create trigger reading_plans_set_updated_at before update on public.reading_plans
for each row execute function public.set_updated_at();
create trigger user_reading_plans_set_updated_at before update on public.user_reading_plans
for each row execute function public.set_updated_at();

alter table public.bible_licenses enable row level security;
alter table public.bible_licenses force row level security;
alter table public.bible_versions enable row level security;
alter table public.bible_versions force row level security;
alter table public.bible_books enable row level security;
alter table public.bible_books force row level security;
alter table public.bible_verses enable row level security;
alter table public.bible_verses force row level security;
alter table public.reading_plans enable row level security;
alter table public.reading_plans force row level security;
alter table public.reading_plan_days enable row level security;
alter table public.reading_plan_days force row level security;
alter table public.user_reading_plans enable row level security;
alter table public.user_reading_plans force row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_progress force row level security;

create policy "licenses_read_available" on public.bible_licenses for select to anon, authenticated
using (status in ('authorized', 'authorized_limited') or public.is_editor());
create policy "versions_read_published" on public.bible_versions for select to anon, authenticated
using (
  (status = 'published' and exists (
    select 1 from public.bible_licenses l
    where l.id = bible_versions.license_id
      and l.status in ('authorized', 'authorized_limited')
      and l.allows_reading
  )) or public.is_editor()
);
create policy "books_read_available" on public.bible_books for select to anon, authenticated
using (exists (
  select 1 from public.bible_versions v
  join public.bible_licenses l on l.id = v.license_id
  where v.id = bible_books.version_id and v.status = 'published'
    and l.status in ('authorized', 'authorized_limited') and l.allows_reading
) or public.is_editor());
create policy "verses_read_available" on public.bible_verses for select to anon, authenticated
using (exists (
  select 1 from public.bible_books b
  join public.bible_versions v on v.id = b.version_id
  join public.bible_licenses l on l.id = v.license_id
  where b.id = bible_verses.book_id and v.status = 'published'
    and l.status in ('authorized', 'authorized_limited') and l.allows_reading
) or public.is_editor());
create policy "plans_read_published" on public.reading_plans for select to anon, authenticated
using (status = 'published' or public.is_editor());
create policy "plan_days_read_published" on public.reading_plan_days for select to anon, authenticated
using (exists (
  select 1 from public.reading_plans p
  where p.id = reading_plan_days.plan_id and p.status = 'published'
) or public.is_editor());
create policy "user_plans_own_all" on public.user_reading_plans for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reading_progress_own_all" on public.reading_progress for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.bible_licenses, public.bible_versions, public.bible_books,
  public.bible_verses, public.reading_plans, public.reading_plan_days,
  public.user_reading_plans, public.reading_progress from anon, authenticated;
grant select on public.bible_licenses, public.bible_versions, public.bible_books,
  public.bible_verses, public.reading_plans, public.reading_plan_days to anon, authenticated;
grant select, insert, update, delete on public.user_reading_plans, public.reading_progress
  to authenticated;

create or replace function public.search_bible(
  p_version_id uuid,
  p_query text,
  p_limit integer default 20
)
returns table (
  verse_id bigint,
  book_name text,
  abbreviation text,
  chapter smallint,
  verse smallint,
  verse_text text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select v.id, b.name, b.abbreviation, v.chapter, v.verse, v.text
  from public.bible_verses v
  join public.bible_books b on b.id = v.book_id
  join public.bible_versions bv on bv.id = b.version_id
  join public.bible_licenses l on l.id = bv.license_id
  where b.version_id = p_version_id
    and l.allows_search
    and length(trim(p_query)) >= 2
    and v.search_vector @@ plainto_tsquery('simple', trim(p_query))
  order by b.canonical_order, v.chapter, v.verse
  limit least(greatest(p_limit, 1), 50);
$$;

revoke all on function public.search_bible(uuid, text, integer) from public;
grant execute on function public.search_bible(uuid, text, integer) to anon, authenticated;

commit;

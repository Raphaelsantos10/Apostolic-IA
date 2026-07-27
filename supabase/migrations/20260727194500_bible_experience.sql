begin;

create type public.highlight_color as enum ('yellow', 'green', 'blue', 'rose');

create table public.verse_highlights (
  user_id uuid not null references public.profiles(id) on delete cascade,
  verse_id bigint not null references public.bible_verses(id) on delete cascade,
  color public.highlight_color not null default 'yellow',
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, verse_id)
);

create table public.bible_context_notes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.bible_books(id) on delete cascade,
  chapter smallint check (chapter is null or chapter > 0),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 10 and 3000),
  source_label text not null,
  status public.editorial_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint context_publication check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

create table public.bible_timeline_events (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.bible_versions(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 1000),
  period_label text not null,
  sort_year integer not null,
  reference_label text not null,
  status public.editorial_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timeline_publication check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

create table public.bible_map_locations (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.bible_versions(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text not null check (char_length(description) between 10 and 1000),
  latitude numeric(8,5) not null check (latitude between -90 and 90),
  longitude numeric(8,5) not null check (longitude between -180 and 180),
  reference_label text not null,
  status public.editorial_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint map_location_publication check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

create trigger verse_highlights_set_updated_at before update on public.verse_highlights
for each row execute function public.set_updated_at();
create trigger bible_context_notes_set_updated_at before update on public.bible_context_notes
for each row execute function public.set_updated_at();
create trigger bible_timeline_events_set_updated_at before update on public.bible_timeline_events
for each row execute function public.set_updated_at();
create trigger bible_map_locations_set_updated_at before update on public.bible_map_locations
for each row execute function public.set_updated_at();

alter table public.verse_highlights enable row level security;
alter table public.verse_highlights force row level security;
alter table public.bible_context_notes enable row level security;
alter table public.bible_context_notes force row level security;
alter table public.bible_timeline_events enable row level security;
alter table public.bible_timeline_events force row level security;
alter table public.bible_map_locations enable row level security;
alter table public.bible_map_locations force row level security;

create policy "highlights_own_all" on public.verse_highlights for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "context_read_published" on public.bible_context_notes for select to anon, authenticated
using (status = 'published' or public.is_editor());
create policy "timeline_read_published" on public.bible_timeline_events for select to anon, authenticated
using (status = 'published' or public.is_editor());
create policy "locations_read_published" on public.bible_map_locations for select to anon, authenticated
using (status = 'published' or public.is_editor());

revoke all on public.verse_highlights, public.bible_context_notes,
  public.bible_timeline_events, public.bible_map_locations from anon, authenticated;
grant select, insert, update, delete on public.verse_highlights to authenticated;
grant select on public.bible_context_notes, public.bible_timeline_events,
  public.bible_map_locations to anon, authenticated;

comment on table public.verse_highlights is
  'Destaques e notas bíblicas privados, isolados pelo titular.';
comment on table public.bible_context_notes is
  'Contexto editorial publicado com fonte identificada.';
comment on table public.bible_timeline_events is
  'Eventos cronológicos editoriais; datas aproximadas devem ser declaradas.';
comment on table public.bible_map_locations is
  'Coordenadas editoriais para visualização geográfica sem mapa proprietário.';

commit;

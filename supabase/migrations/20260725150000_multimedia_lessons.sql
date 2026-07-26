begin;

create type public.lesson_kind as enum ('text', 'image', 'audio', 'video', 'mixed');

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 160),
  summary text not null check (char_length(summary) between 10 and 500),
  kind public.lesson_kind not null default 'text',
  body_text text,
  media_url text,
  media_mime_type text,
  alt_text text,
  transcript text,
  captions_url text,
  license_name text,
  rights_holder text,
  status public.editorial_status not null default 'draft',
  position integer not null check (position >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug),
  unique (module_id, position),
  constraint lesson_publication_date check (
    (status = 'published' and published_at is not null)
    or status <> 'published'
  ),
  constraint lesson_text_required check (
    kind not in ('text', 'mixed')
    or nullif(trim(body_text), '') is not null
  ),
  constraint lesson_media_required check (
    kind = 'text'
    or (
      nullif(trim(media_url), '') is not null
      and nullif(trim(media_mime_type), '') is not null
      and nullif(trim(license_name), '') is not null
      and nullif(trim(rights_holder), '') is not null
    )
  ),
  constraint lesson_image_accessibility check (
    kind not in ('image', 'mixed')
    or nullif(trim(alt_text), '') is not null
  ),
  constraint lesson_audio_accessibility check (
    kind not in ('audio', 'video', 'mixed')
    or nullif(trim(transcript), '') is not null
  ),
  constraint lesson_video_accessibility check (
    kind <> 'video'
    or nullif(trim(captions_url), '') is not null
  )
);

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

alter table public.lessons enable row level security;
alter table public.lessons force row level security;

create policy "lessons_read_published" on public.lessons
for select to anon, authenticated
using (
  (
    status = 'published'
    and exists (
      select 1
      from public.course_modules
      join public.courses on courses.id = course_modules.course_id
      where course_modules.id = lessons.module_id
        and course_modules.status = 'published'
        and courses.status = 'published'
    )
  )
  or public.is_editor()
);

create policy "lessons_editor_insert" on public.lessons
for insert to authenticated with check (public.is_editor());
create policy "lessons_editor_update" on public.lessons
for update to authenticated
using (public.is_editor()) with check (public.is_editor());
create policy "lessons_editor_delete" on public.lessons
for delete to authenticated using (public.is_editor());

revoke all on public.lessons from anon, authenticated;
grant select on public.lessons to anon, authenticated;
grant insert, update, delete on public.lessons to authenticated;

comment on table public.lessons is
  'Aulas autorais; mídia publicada exige licença e recursos de acessibilidade.';

commit;

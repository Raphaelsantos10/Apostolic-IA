begin;

create type public.course_product_kind as enum (
  'seminary',
  'individual_course',
  'bundle'
);

create type public.theological_review_kind as enum (
  'doctrinal',
  'pedagogical',
  'editorial'
);

create type public.review_decision as enum (
  'approved',
  'changes_requested'
);

alter table public.courses
  add column product_kind public.course_product_kind not null
    default 'individual_course',
  add column content_version integer not null default 1
    check (content_version > 0),
  add column author_id uuid references public.profiles(id) on delete set null;

create table public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  content_version integer not null check (content_version > 0),
  review_kind public.theological_review_kind not null,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision public.review_decision not null,
  notes text not null default '' check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  unique (course_id, content_version, review_kind)
);

create or replace function public.course_has_human_approval(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) = 3
  from public.course_reviews r
  join public.courses c on c.id = r.course_id
  where r.course_id = p_course_id
    and r.content_version = c.content_version
    and r.decision = 'approved'
    and r.reviewer_id is distinct from c.author_id;
$$;

create or replace function public.guard_course_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published'
    and coalesce(current_setting('apostolic.seed_mode', true), 'off') <> 'on'
    and not public.course_has_human_approval(new.id) then
    raise exception 'PUBLICATION_REQUIRES_HUMAN_APPROVAL';
  end if;
  return new;
end;
$$;

create trigger courses_guard_publication
before insert or update of status on public.courses
for each row execute function public.guard_course_publication();

alter table public.course_reviews enable row level security;
alter table public.course_reviews force row level security;

create policy "reviews_editor_read" on public.course_reviews
for select to authenticated using (public.is_editor());
create policy "reviews_editor_insert" on public.course_reviews
for insert to authenticated with check (
  public.is_editor()
  and reviewer_id = (select auth.uid())
  and reviewer_id is distinct from (
    select author_id from public.courses where id = course_id
  )
);

revoke all on public.course_reviews from anon, authenticated;
grant select, insert on public.course_reviews to authenticated;
revoke all on function public.course_has_human_approval(uuid) from public;
grant execute on function public.course_has_human_approval(uuid)
  to authenticated;

comment on table public.course_reviews is
  'Pareceres humanos versionados exigidos para publicar conteúdo teológico.';

commit;

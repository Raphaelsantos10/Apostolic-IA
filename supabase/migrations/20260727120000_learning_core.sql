begin;

create type public.lesson_progress_status as enum ('not_started', 'in_progress', 'completed');

create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status public.lesson_progress_status not null default 'not_started',
  percent smallint not null default 0 check (percent between 0 and 100),
  last_position integer not null default 0 check (last_position >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id),
  constraint completed_progress check (
    (status = 'completed' and percent = 100 and completed_at is not null)
    or status <> 'completed'
  )
);

create table public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.daily_goals (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  daily_minutes smallint not null default 10 check (daily_minutes between 5 and 180),
  active_days smallint[] not null default array[1,2,3,4,5,6,7]::smallint[],
  reminders_enabled boolean not null default false,
  reminder_time time,
  timezone text not null default 'Europe/Lisbon',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_active_days check (
    cardinality(active_days) between 1 and 7
    and active_days <@ array[1,2,3,4,5,6,7]::smallint[]
  ),
  constraint reminder_pair check (
    reminders_enabled = false or reminder_time is not null
  )
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 10 and 1000),
  options jsonb not null check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 8
  ),
  correct_index smallint not null check (correct_index between 0 and 7),
  explanation text not null check (char_length(explanation) between 10 and 2000),
  status public.editorial_status not null default 'draft',
  position integer not null check (position >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, position),
  constraint correct_option_exists check (correct_index < jsonb_array_length(options)),
  constraint quiz_publication_date check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_index smallint not null check (selected_index between 0 and 7),
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);

create table public.review_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  due_at timestamptz not null default now(),
  interval_days integer not null default 1 check (interval_days between 1 and 3650),
  correct_streak integer not null default 0 check (correct_streak >= 0),
  last_result boolean,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create trigger lesson_progress_set_updated_at before update on public.lesson_progress
for each row execute function public.set_updated_at();
create trigger lesson_notes_set_updated_at before update on public.lesson_notes
for each row execute function public.set_updated_at();
create trigger daily_goals_set_updated_at before update on public.daily_goals
for each row execute function public.set_updated_at();
create trigger quiz_questions_set_updated_at before update on public.quiz_questions
for each row execute function public.set_updated_at();
create trigger review_items_set_updated_at before update on public.review_items
for each row execute function public.set_updated_at();

alter table public.lesson_progress enable row level security;
alter table public.lesson_progress force row level security;
alter table public.lesson_notes enable row level security;
alter table public.lesson_notes force row level security;
alter table public.lesson_favorites enable row level security;
alter table public.lesson_favorites force row level security;
alter table public.daily_goals enable row level security;
alter table public.daily_goals force row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_questions force row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempts force row level security;
alter table public.review_items enable row level security;
alter table public.review_items force row level security;

create policy "progress_own_all" on public.lesson_progress
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "notes_own_all" on public.lesson_notes
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "favorites_own_all" on public.lesson_favorites
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "goals_own_all" on public.daily_goals
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "attempts_select_own" on public.quiz_attempts
for select to authenticated using ((select auth.uid()) = user_id);
create policy "reviews_select_own" on public.review_items
for select to authenticated using ((select auth.uid()) = user_id);

create policy "quiz_read_published" on public.quiz_questions
for select to anon, authenticated
using (
  (
    status = 'published'
    and exists (
      select 1 from public.lessons
      where lessons.id = quiz_questions.lesson_id
        and lessons.status = 'published'
    )
  )
  or public.is_editor()
);
create policy "quiz_editor_insert" on public.quiz_questions
for insert to authenticated with check (public.is_editor());
create policy "quiz_editor_update" on public.quiz_questions
for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "quiz_editor_delete" on public.quiz_questions
for delete to authenticated using (public.is_editor());

revoke all on public.lesson_progress, public.lesson_notes, public.lesson_favorites,
  public.daily_goals, public.quiz_questions, public.quiz_attempts, public.review_items
  from anon, authenticated;
grant select, insert, update, delete on public.lesson_progress, public.lesson_notes,
  public.lesson_favorites, public.daily_goals to authenticated;
grant select (id, lesson_id, prompt, options, status, position, published_at)
  on public.quiz_questions to anon, authenticated;
grant insert, update, delete on public.quiz_questions to authenticated;
grant select on public.quiz_attempts, public.review_items to authenticated;

create or replace function public.submit_quiz_answer(
  p_question_id uuid,
  p_selected_index integer
)
returns table (is_correct boolean, explanation text, next_review_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_correct_index smallint;
  v_explanation text;
  v_is_correct boolean;
  v_interval integer;
  v_due timestamptz;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select q.correct_index, q.explanation
  into v_correct_index, v_explanation
  from public.quiz_questions q
  where q.id = p_question_id and q.status = 'published';

  if not found then
    raise exception 'published question not found';
  end if;

  if p_selected_index < 0 or p_selected_index >= (
    select jsonb_array_length(options) from public.quiz_questions where id = p_question_id
  ) then
    raise exception 'invalid option';
  end if;

  v_is_correct := p_selected_index = v_correct_index;

  insert into public.quiz_attempts(user_id, question_id, selected_index, is_correct)
  values (v_user_id, p_question_id, p_selected_index, v_is_correct);

  select case
    when v_is_correct then least(coalesce(interval_days, 1) * 2, 3650)
    else 1
  end
  into v_interval
  from public.review_items
  where user_id = v_user_id and question_id = p_question_id;

  v_interval := coalesce(v_interval, case when v_is_correct then 2 else 1 end);
  v_due := now() + make_interval(days => v_interval);

  insert into public.review_items(
    user_id, question_id, due_at, interval_days, correct_streak, last_result
  ) values (
    v_user_id, p_question_id, v_due, v_interval,
    case when v_is_correct then 1 else 0 end, v_is_correct
  )
  on conflict (user_id, question_id) do update set
    due_at = excluded.due_at,
    interval_days = excluded.interval_days,
    correct_streak = case
      when excluded.last_result then public.review_items.correct_streak + 1 else 0
    end,
    last_result = excluded.last_result,
    updated_at = now();

  return query select v_is_correct, v_explanation, v_due;
end;
$$;

revoke all on function public.submit_quiz_answer(uuid, integer) from public;
grant execute on function public.submit_quiz_answer(uuid, integer) to authenticated;

commit;

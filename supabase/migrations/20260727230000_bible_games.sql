begin;

create table public.game_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  correct_answers integer not null default 0 check (correct_answers>=0),
  total_answers integer not null default 0 check (total_answers>=0),
  updated_at timestamptz not null default now()
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  difficulty smallint not null check (difficulty between 1 and 3),
  status text not null default 'active' check(status in ('active','completed','abandoned')),
  question_ids uuid[] not null check(cardinality(question_ids) between 1 and 10),
  current_index smallint not null default 0 check(current_index>=0),
  score smallint not null default 0 check(score>=0),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.game_answers (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_index smallint not null check(selected_index between 0 and 7),
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique(session_id,question_id)
);

alter table public.game_profiles enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_answers enable row level security;
alter table public.game_profiles force row level security;
alter table public.game_sessions force row level security;
alter table public.game_answers force row level security;
create policy game_profiles_own on public.game_profiles for select to authenticated using(user_id=(select auth.uid()));
create policy game_sessions_own on public.game_sessions for select to authenticated using(user_id=(select auth.uid()));
create policy game_answers_own on public.game_answers for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.game_profiles,public.game_sessions,public.game_answers from anon,authenticated;
grant select on public.game_profiles,public.game_sessions,public.game_answers to authenticated;

create or replace function public.start_bible_game(p_question_count integer default 5)
returns public.game_sessions language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid()); v_level smallint; v_ids uuid[]; v_session public.game_sessions;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if p_question_count not between 1 and 10 then raise exception 'invalid question count'; end if;
 select coalesce(difficulty,1) into v_level from public.game_profiles where user_id=v_user;
 v_level:=coalesce(v_level,1);
 select array_agg(id) into v_ids from (
   select q.id from public.quiz_questions q join public.lessons l on l.id=q.lesson_id
   where q.status='published' and l.status='published' order by random() limit p_question_count
 ) approved;
 if coalesce(cardinality(v_ids),0)=0 then raise exception 'no approved questions available'; end if;
 insert into public.game_sessions(user_id,difficulty,question_ids)
 values(v_user,v_level,v_ids) returning * into v_session;
 return v_session;
end $$;

create or replace function public.answer_bible_game(p_session uuid,p_selected_index integer)
returns table(is_correct boolean,explanation text,session_completed boolean,score smallint,difficulty smallint)
language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid()); v_session public.game_sessions; v_question uuid;
 v_result record; v_complete boolean; v_total integer; v_correct integer; v_level smallint;
begin
 select * into v_session from public.game_sessions where id=p_session and user_id=v_user and status='active' for update;
 if not found then raise exception 'active session not found'; end if;
 v_question:=v_session.question_ids[v_session.current_index+1];
 select * into v_result from public.submit_quiz_answer(v_question,p_selected_index);
 insert into public.game_answers(session_id,user_id,question_id,selected_index,is_correct)
 values(p_session,v_user,v_question,p_selected_index,v_result.is_correct);
 v_complete:=v_session.current_index+1>=cardinality(v_session.question_ids);
 update public.game_sessions gs set current_index=gs.current_index+1,
   score=gs.score+case when v_result.is_correct then 1 else 0 end,
   status=case when v_complete then 'completed' else 'active' end,
   completed_at=case when v_complete then now() else null end where gs.id=p_session
   returning gs.score into v_session.score;
 insert into public.game_profiles(user_id,correct_answers,total_answers)
 values(v_user,case when v_result.is_correct then 1 else 0 end,1)
 on conflict(user_id) do update set correct_answers=game_profiles.correct_answers+excluded.correct_answers,
 total_answers=game_profiles.total_answers+1,updated_at=now();
 select total_answers,correct_answers into v_total,v_correct from public.game_profiles where user_id=v_user;
 v_level:=case when v_total>=10 and v_correct::numeric/v_total>=.8 then 3
   when v_total>=5 and v_correct::numeric/v_total>=.6 then 2 else 1 end;
 update public.game_profiles set difficulty=v_level where user_id=v_user;
 return query select v_result.is_correct,v_result.explanation,v_complete,v_session.score,v_level;
end $$;

revoke all on function public.start_bible_game(integer),public.answer_bible_game(uuid,integer) from public;
grant execute on function public.start_bible_game(integer),public.answer_bible_game(uuid,integer) to authenticated;
commit;

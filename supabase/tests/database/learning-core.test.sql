begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
('88888888-8888-4888-8888-888888888888','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','learner-a@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Estudante A"}',now(),now()),
('99999999-9999-4999-8999-999999999999','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','learner-b@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Estudante B"}',now(),now());

insert into public.quiz_questions(
  lesson_id,prompt,options,correct_index,explanation,status,position,published_at
)
select id,'Qual prática ajuda a interpretar uma passagem no seu contexto?',
  '["Ignorar o gênero","Observar contexto literário e histórico","Ler apenas uma frase"]',
  1,'O contexto literário e histórico ajuda a compreender a passagem.',
  'published',99,now()
from public.lessons where slug='por-que-o-contexto-importa';

set local role authenticated;
set local request.jwt.claim.sub='88888888-8888-4888-8888-888888888888';

insert into public.lesson_progress(user_id,lesson_id,status,percent,started_at)
select auth.uid(),id,'in_progress',50,now()
from public.lessons where slug='por-que-o-contexto-importa';
insert into public.lesson_notes(user_id,lesson_id,body)
select auth.uid(),id,'Minha anotação privada.'
from public.lessons where slug='por-que-o-contexto-importa';
insert into public.lesson_favorites(user_id,lesson_id)
select auth.uid(),id from public.lessons where slug='por-que-o-contexto-importa';
insert into public.daily_goals(user_id,daily_minutes,active_days)
values(auth.uid(),15,array[1,2,3,4,5]::smallint[]);

select is((select count(*)::integer from public.lesson_progress),1,'vê o próprio progresso');
select is((select count(*)::integer from public.lesson_notes),1,'vê a própria anotação');
select is((select count(*)::integer from public.lesson_favorites),1,'vê o próprio favorito');
select is((select daily_minutes from public.daily_goals),15::smallint,'guarda a meta diária');

select is(
  (select is_correct from public.submit_quiz_answer(
    (select id from public.quiz_questions where position=99),1
  )), true, 'RPC corrige resposta certa'
);
select is((select count(*)::integer from public.quiz_attempts),1,'registra tentativa');
select is((select count(*)::integer from public.review_items),1,'agenda revisão');
select ok((select due_at > now() from public.review_items),'revisão fica no futuro');

reset role;
set local role authenticated;
set local request.jwt.claim.sub='99999999-9999-4999-8999-999999999999';

select is((select count(*)::integer from public.lesson_notes),0,'outra conta não vê notas');
select is((select count(*)::integer from public.lesson_progress),0,'outra conta não vê progresso');

select * from finish();
rollback;

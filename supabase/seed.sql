-- A Sprint 012 não distribui contas ou conteúdo fictício.
-- Utilize o fluxo local de autenticação para criar utilizadores de desenvolvimento.

insert into public.courses (slug, title, summary, level, status, position, published_at)
values
  ('fundamentos-biblicos', 'Fundamentos Bíblicos',
   'Princípios autorais para iniciar uma leitura bíblica responsável e contextual.',
   'beginner', 'published', 1, now()),
  ('vida-crista-discipulado', 'Vida Cristã e Discipulado',
   'Formação prática para crescimento, caráter, oração e serviço cristão.',
   'intermediate', 'published', 2, now()),
  ('panorama-das-escrituras', 'Panorama das Escrituras',
   'Visão introdutória da narrativa bíblica do Antigo ao Novo Testamento.',
   'beginner', 'published', 3, now())
on conflict (slug) do nothing;

insert into public.course_modules
  (course_id, slug, title, summary, status, position, published_at)
select c.id, m.slug, m.title, m.summary, 'published', m.position, now()
from public.courses c
join (values
  ('fundamentos-biblicos', 'leitura-contextual', 'Leitura contextual',
   'Introdução ao contexto literário, histórico e doutrinário.', 1),
  ('fundamentos-biblicos', 'autoridade-das-escrituras', 'Autoridade das Escrituras',
   'Fundamentos para reconhecer a Bíblia como autoridade de fé e prática.', 2),
  ('vida-crista-discipulado', 'carater-cristao', 'Caráter cristão',
   'Princípios bíblicos para caráter, comunhão e serviço.', 1),
  ('panorama-das-escrituras', 'narrativa-biblica', 'A narrativa bíblica',
   'Uma visão geral da criação, redenção e esperança cristã.', 1)
) as m(course_slug, slug, title, summary, position)
on c.slug = m.course_slug
on conflict (course_id, slug) do nothing;

insert into public.lessons
  (module_id, slug, title, summary, kind, body_text, status, position, published_at)
select m.id, l.slug, l.title, l.summary, 'text', l.body_text,
  'published', l.position, now()
from public.course_modules m
join (values
  ('leitura-contextual', 'por-que-o-contexto-importa', 'Por que o contexto importa',
   'Aprenda por que uma passagem deve ser lida dentro do seu contexto.',
   'Uma leitura responsável observa o texto, o gênero literário, o contexto histórico e a mensagem bíblica completa.', 1),
  ('autoridade-das-escrituras', 'biblia-fe-e-pratica', 'Bíblia, fé e prática',
   'Uma introdução à autoridade das Escrituras na vida cristã.',
   'A Bíblia orienta a fé e a prática cristã. Interpretações devem ser examinadas com humildade, contexto e responsabilidade.', 1),
  ('carater-cristao', 'crescimento-e-servico', 'Crescimento e serviço',
   'Caráter cristão demonstrado na comunhão e no serviço.',
   'O crescimento cristão envolve amor, domínio próprio, fidelidade, comunhão e serviço ao próximo.', 1),
  ('narrativa-biblica', 'criacao-redencao-esperanca', 'Criação, redenção e esperança',
   'Uma visão inicial dos grandes movimentos da narrativa bíblica.',
   'A narrativa bíblica apresenta criação, queda, promessa, redenção e esperança, culminando em Cristo.', 1)
) as l(module_slug, slug, title, summary, body_text, position)
on m.slug = l.module_slug
on conflict (module_id, slug) do nothing;


insert into public.quiz_questions
  (lesson_id, prompt, options, correct_index, explanation, status, position, published_at)
select l.id, q.prompt, q.options::jsonb, q.correct_index, q.explanation,
  'published', q.position, now()
from public.lessons l
join (values
  ('por-que-o-contexto-importa',
   'O que deve ser observado numa leitura bíblica responsável?',
   '["Somente uma frase isolada","Contexto literário, histórico e canônico","A opinião mais popular"]',
   1,'Uma leitura responsável considera os contextos literário, histórico e canônico.',1),
  ('crescimento-e-servico',
   'Qual alternativa representa crescimento cristão no conteúdo da aula?',
   '["Superioridade sobre outros","Amor, fidelidade e serviço","Competição espiritual"]',
   1,'Crescimento cristão é demonstrado em amor, fidelidade, comunhão e serviço.',1)
) as q(lesson_slug,prompt,options,correct_index,explanation,position)
on l.slug=q.lesson_slug
on conflict (lesson_id, position) do nothing;

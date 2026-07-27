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

-- Conteúdo autoral e fictício para validar a plataforma sem distribuir uma
-- tradução bíblica protegida. Não deve ser apresentado como texto das Escrituras.
insert into public.bible_licenses (
  code, rights_holder, status, allows_reading, allows_search, allows_comparison,
  allows_offline, allows_audio, attribution, territories, evidence_reference
) values (
  'demonstracao-autoral-interna', 'Apostolic IA', 'authorized', true, true, true,
  false, false, 'Texto demonstrativo autoral — não é uma tradução bíblica.',
  array['DEV'], 'docs/legal/BIBLE_LICENSING_POLICY.md'
) on conflict (code) do nothing;

insert into public.bible_versions (
  license_id, code, name, language, edition, is_demo, status, published_at
)
select id, 'VDA', 'Versão Demonstrativa Autoral', 'pt-PT', 'Protótipo 2026',
  true, 'published', now()
from public.bible_licenses where code='demonstracao-autoral-interna'
on conflict (code) do nothing;

insert into public.bible_books (
  version_id, canonical_order, testament, name, abbreviation, chapter_count
)
select v.id, b.canonical_order, b.testament, b.name, b.abbreviation, 1
from public.bible_versions v
cross join (values
  (1::smallint, 'old', 'Livro Demonstrativo Primeiro', 'LDP'),
  (40::smallint, 'new', 'Livro Demonstrativo Segundo', 'LDS')
) as b(canonical_order, testament, name, abbreviation)
where v.code='VDA'
on conflict (version_id, canonical_order) do nothing;

insert into public.bible_verses (book_id, chapter, verse, text)
select b.id, 1, content.verse, content.text
from public.bible_books b
join (values
  ('LDP', 1::smallint, 'Texto fictício: no princípio desta demonstração, a leitura responsável começou com contexto.'),
  ('LDP', 2::smallint, 'Texto fictício: conhecimento e prática caminharam juntos em humildade e serviço.'),
  ('LDS', 1::smallint, 'Texto fictício: a esperança orientou a jornada, sem substituir o texto bíblico licenciado.'),
  ('LDS', 2::smallint, 'Texto fictício: cada leitor examinou o conteúdo com responsabilidade e comunhão.')
) as content(abbreviation, verse, text) on content.abbreviation=b.abbreviation
where not exists (
  select 1 from public.bible_verses existing
  where existing.book_id=b.id and existing.chapter=1 and existing.verse=content.verse
);

insert into public.reading_plans (
  slug, title, description, duration_days, status, published_at
) values (
  'jornada-demonstrativa', 'Jornada demonstrativa',
  'Plano autoral para testar metas e progresso sem distribuir uma tradução protegida.',
  2, 'published', now()
) on conflict (slug) do nothing;

insert into public.reading_plan_days (
  plan_id, day_number, title, reference_label, book_id, chapter_start, chapter_end
)
select p.id, d.day_number, d.title, d.reference_label, b.id, 1, 1
from public.reading_plans p
join (values
  (1::smallint, 'Leitura responsável', 'LDP 1', 'LDP'),
  (2::smallint, 'Esperança e serviço', 'LDS 1', 'LDS')
) as d(day_number, title, reference_label, abbreviation) on true
join public.bible_books b on b.abbreviation=d.abbreviation
join public.bible_versions v on v.id=b.version_id and v.code='VDA'
where p.slug='jornada-demonstrativa'
on conflict (plan_id, day_number) do nothing;

update public.bible_licenses
set allows_audio=true, allows_offline=true
where code='demonstracao-autoral-interna';

insert into public.bible_context_notes (
  book_id, chapter, title, body, source_label, status, published_at
)
select b.id, 1, c.title, c.body, 'Conteúdo demonstrativo autoral',
  'published', now()
from public.bible_books b
join (values
  ('LDP','Contexto literário demonstrativo',
   'Este livro fictício exemplifica como gênero, contexto e mensagem completa ajudam a leitura responsável.'),
  ('LDS','Contexto histórico demonstrativo',
   'Este conteúdo autoral serve apenas para validar recursos de contexto sem reproduzir uma tradução bíblica.')
) as c(abbreviation,title,body) on c.abbreviation=b.abbreviation
join public.bible_versions v on v.id=b.version_id and v.code='VDA'
where not exists (
  select 1 from public.bible_context_notes n
  where n.book_id=b.id and n.chapter=1 and n.title=c.title
);

insert into public.bible_timeline_events (
  version_id,title,description,period_label,sort_year,reference_label,status,published_at
)
select v.id,e.title,e.description,e.period_label,e.sort_year,e.reference_label,
  'published',now()
from public.bible_versions v
cross join (values
  ('Início demonstrativo','Marco fictício para validar a ordenação cronológica.',
   'Período demonstrativo A',-100,'LDP 1'),
  ('Esperança demonstrativa','Segundo marco fictício da experiência bíblica.',
   'Período demonstrativo B',100,'LDS 1')
) as e(title,description,period_label,sort_year,reference_label)
where v.code='VDA'
and not exists (
  select 1 from public.bible_timeline_events t
  where t.version_id=v.id and t.title=e.title
);

insert into public.bible_map_locations (
  version_id,name,description,latitude,longitude,reference_label,status,published_at
)
select v.id,l.name,l.description,l.latitude,l.longitude,l.reference_label,
  'published',now()
from public.bible_versions v
cross join (values
  ('Local demonstrativo Norte','Coordenada fictícia para validar a visualização geográfica.',
   40.00000::numeric,-8.00000::numeric,'LDP 1'),
  ('Local demonstrativo Sul','Segundo ponto fictício, sem afirmar geografia bíblica real.',
   38.00000::numeric,-7.00000::numeric,'LDS 1')
) as l(name,description,latitude,longitude,reference_label)
where v.code='VDA'
and not exists (
  select 1 from public.bible_map_locations m
  where m.version_id=v.id and m.name=l.name
);

insert into public.achievement_definitions(
  id,title,description,icon,points_threshold,streak_threshold
) values
('primeiros-passos','Primeiros passos','Concluiu a primeira atividade de aprendizagem.','★',10,null),
('aprendiz-dedicado','Aprendiz dedicado','Alcançou 100 pontos de aprendizagem verificável.','◆',100,null),
('constancia-tres-dias','Constância saudável','Estudou em três dias consecutivos.','◉',null,3)
on conflict(id) do nothing;

insert into public.mission_definitions(id,title,description,activity_kind,target_count)
values
('concluir-uma-aula','Concluir uma aula','Conclua uma aula publicada no seu ritmo.','lesson_completed',1),
('responder-tres-quizzes','Praticar com quizzes','Acerte três perguntas para revisar o conteúdo.','quiz_correct',3),
('ler-dois-dias','Continuar um plano','Conclua dois dias de um plano de leitura.','reading_day_completed',2)
on conflict(id) do nothing;

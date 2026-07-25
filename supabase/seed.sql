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

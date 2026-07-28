begin;

-- Funções de gatilho SECURITY DEFINER não precisam ser chamadas por clientes.
revoke all on function public.guard_course_publication()
  from public, anon, authenticated;

comment on function public.guard_course_publication() is
  'Impede publicação sem aprovação humana; execução exclusiva por gatilho.';

commit;

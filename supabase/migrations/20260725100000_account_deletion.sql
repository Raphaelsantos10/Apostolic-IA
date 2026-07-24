begin;

create or replace function public.delete_own_account(confirmation text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if confirmation is distinct from 'EXCLUIR' then
    raise exception 'invalid confirmation' using errcode = '22023';
  end if;

  update public.profiles
  set status = 'deletion_requested'
  where id = current_user_id;

  delete from auth.users
  where id = current_user_id;
end;
$$;

revoke all on function public.delete_own_account(text) from public;
grant execute on function public.delete_own_account(text) to authenticated;

comment on function public.delete_own_account(text) is
  'Exclui a conta autenticada e os dados pessoais ligados por cascata.';

commit;

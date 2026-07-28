begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table('public','api_rate_limits','possui limites de API');
select has_function(
  'public','consume_api_rate_limit',array['text','integer','integer'],
  'possui função transacional de limite'
);

insert into auth.users (
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
('30303030-3030-4030-8030-303030303030',
 '00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','security-a@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Segurança A"}',now(),now()),
('31313131-3131-4131-8131-313131313131',
 '00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','security-b@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Segurança B"}',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='30303030-3030-4030-8030-303030303030';
select is(
  public.consume_api_rate_limit('test-bucket',2,60),true,
  'primeira chamada permitida'
);
select is(
  public.consume_api_rate_limit('test-bucket',2,60),true,
  'segunda chamada permitida'
);
select is(
  public.consume_api_rate_limit('test-bucket',2,60),false,
  'chamada acima do limite bloqueada'
);
select throws_ok(
  $$select * from public.api_rate_limits$$,'42501',null,
  'contador não possui acesso direto'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub='31313131-3131-4131-8131-313131313131';
select is(
  public.consume_api_rate_limit('test-bucket',2,60),true,
  'segunda conta possui limite independente'
);

reset role;
select is(
  (select count(*)::integer from public.api_rate_limits),2,
  'cada conta possui contador separado'
);

select * from finish();
rollback;

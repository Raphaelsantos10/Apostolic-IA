begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select has_table('public','course_reviews','tabela de pareceres existe');
select has_column('public','courses','product_kind','curso possui tipo comercial');
select has_column('public','courses','content_version','conteúdo é versionado');
select has_function('public','course_has_human_approval',
  array['uuid'],'função de aprovação existe');

select col_is_pk('public','course_reviews','id','parecer possui chave primária');
select col_not_null('public','course_reviews','reviewer_id',
  'parecer exige revisor humano');
select col_not_null('public','course_reviews','decision',
  'parecer exige decisão');

select * from finish();
rollback;


begin;select plan(13);
select has_table('public','apostolic_worlds');select has_table('public','apostolic_world_regions');select has_table('public','apostolic_provinces');select has_table('public','apostolic_cities');select has_table('public','apostolic_city_resources');select has_table('public','apostolic_resource_ledger');select has_table('public','apostolic_city_buildings');
select is((select count(*)::integer from public.apostolic_world_regions),5,'five biblical regions seeded');
select is((select count(*)::integer from public.apostolic_world_regions where is_beta_entry),1,'only Canaan is the beta entry');
select is((select capacity from public.apostolic_provinces limit 1),null::smallint,'provinces are created dynamically');
select function_returns('public','apostolic_create_initial_city',array['text'],'jsonb');select function_returns('public','apostolic_collect_city_production',array['uuid'],'jsonb');select function_returns('public','apostolic_get_city_overview',array[]::text[],'jsonb');
select*from finish();rollback;

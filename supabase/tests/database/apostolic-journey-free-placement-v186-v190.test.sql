begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_column('public','apostolic_city_buildings','map_x','buildings have persistent x');
select has_column('public','apostolic_city_buildings','map_y','buildings have persistent y');
select has_column('public','apostolic_city_buildings','map_rotation','buildings have rotation');
select has_column('public','apostolic_city_buildings','footprint_w','buildings have footprint width');
select has_column('public','apostolic_city_buildings','footprint_h','buildings have footprint height');
select col_not_null('public','apostolic_city_buildings','map_x','x is required');
select col_not_null('public','apostolic_city_buildings','map_y','y is required');
select has_index('public','apostolic_city_buildings','apostolic_city_buildings_map_idx','city map lookup is indexed');
select has_trigger('public','apostolic_city_buildings','apostolic_city_building_initial_placement','new buildings receive placement');
select function_returns('public','apostolic_move_city_building',array['text','integer','integer','integer'],'jsonb');
select is((select prosecdef from pg_proc where oid='public.apostolic_move_city_building(text,integer,integer,integer)'::regprocedure),true,'move is server controlled');
select is((select proconfig@>array['search_path=""']from pg_proc where oid='public.apostolic_move_city_building(text,integer,integer,integer)'::regprocedure),true,'move has empty search path');
select is((select count(*)::integer from information_schema.routine_privileges where routine_schema='public'and routine_name='apostolic_move_city_building'and grantee='anon'),0,'anonymous cannot move buildings');
select is((select count(*)::integer from information_schema.routine_privileges where routine_schema='public'and routine_name='apostolic_move_city_building'and grantee='authenticated'),1,'authenticated player can move buildings');
select is((select position('owner_id=uid' in replace(pg_get_functiondef('public.apostolic_move_city_building(text,integer,integer,integer)'::regprocedure),' ',''))>0),true,'move checks city ownership');
select is((select position('building collision' in pg_get_functiondef('public.apostolic_move_city_building(text,integer,integer,integer)'::regprocedure))>0),true,'move rejects collision');
select is((select position('requires coast' in pg_get_functiondef('public.apostolic_move_city_building(text,integer,integer,integer)'::regprocedure))>0),true,'move validates coast');
select is((select position('map_rotation' in pg_get_functiondef('public.apostolic_get_city_management()'::regprocedure))>0),true,'management returns placement');

select*from finish();
rollback;

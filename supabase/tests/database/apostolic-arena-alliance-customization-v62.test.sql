begin;
select plan(10);

select has_table('public','arena_alliance_background_catalog','V62 stores the curated background catalog');
select has_table('public','arena_alliance_background_unlocks','V62 stores permanent gem unlocks');
select has_table('public','arena_alliance_subscriptions','V62 stores alliance PRO entitlement');
select has_column('public','arena_alliances','background_id','V62 persists the selected background');
select function_returns('public','arena_get_alliance_backgrounds',array[]::text[],'jsonb','V62 exposes background entitlements');
select function_returns('public','arena_purchase_alliance_background',array['text','text'],'jsonb','V62 purchases backgrounds atomically');
select function_returns('public','arena_select_alliance_background',array['text'],'jsonb','V62 selects an entitled background');
select function_returns('public','arena_alliance_has_pro',array['uuid'],'boolean','V62 validates PRO server-side');
select results_eq('select count(*)::bigint from public.arena_alliance_background_catalog',array[20::bigint],'V62 ships exactly twenty backgrounds');
select results_eq($$select count(*)::bigint from public.arena_alliance_background_catalog where tier='free'$$,array[4::bigint],'Only four backgrounds are immediately free');

select * from finish();
rollback;

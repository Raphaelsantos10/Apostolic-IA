begin;
select plan(5);
select function_returns('public','arena_claim_available_pass_rewards',array[]::text[],'jsonb','bulk pass claim RPC exists');
select function_returns('public','arena_get_pass_status',array[]::text[],'jsonb','pass status remains available');
select function_returns('public','arena_claim_pass_reward',array['smallint','text'],'jsonb','individual claim remains available');
select results_eq($$select price::bigint from public.arena_shop_products where id='pass-alianca-s1'$$,array[599::bigint],'premium pass keeps the approved EUR price');
select results_eq($$select count(*)::bigint from public.arena_pass_levels where season_id='alianca-s1' and premium_reward is not null$$,array[10::bigint],'premium track has ten rewards');
select * from finish();
rollback;

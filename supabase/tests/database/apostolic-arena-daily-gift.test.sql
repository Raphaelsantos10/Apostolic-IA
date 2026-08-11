begin;
select plan(5);
select has_table('public','arena_daily_gift_claims','daily claims table exists');
select col_is_pk('public','arena_daily_gift_claims',array['user_id','claimed_on'],'one claim per player per day');
select function_returns('public','arena_daily_gift_status',array[]::text[],'jsonb','gift status RPC exists');
select function_returns('public','arena_claim_daily_gift',array[]::text[],'jsonb','claim RPC exists');
select policies_are('public','arena_daily_gift_claims',array['arena_daily_claims_select_own'],'daily claims have own-row RLS');
select * from finish();
rollback;

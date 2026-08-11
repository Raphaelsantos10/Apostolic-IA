begin;
select plan(9);

select has_table('public','arena_player_wallets','wallet table exists');
select has_table('public','arena_wallet_transactions','ledger table exists');
select has_table('public','arena_shop_products','shop catalog exists');
select has_table('public','arena_player_inventory','inventory exists');
select col_has_check('public','arena_player_wallets','coins','coins cannot be negative');
select col_has_check('public','arena_player_wallets','gems','gems cannot be negative');
select function_returns('public','arena_get_wallet',array[]::text[],'record','wallet RPC exists');
select function_returns('public','arena_purchase_product',array['text','text'],'jsonb','atomic purchase RPC exists');
select policies_are('public','arena_player_wallets',array['arena_wallet_select_own'],'wallet has own-row RLS');

select * from finish();
rollback;

begin;
select has_table('public','arena_shop_chest_openings','V57 stores secure chest openings');
select has_function('public','arena_open_shop_chest',array['text','text'],'V57 exposes chest opening RPC');
select policies_are('public','arena_shop_chest_openings',array['arena_chest_openings_read_own'],'V57 openings remain private');
rollback;

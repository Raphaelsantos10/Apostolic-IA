begin;
select plan(2);
select function_returns('public','arena_browse_alliances',array['text','integer'],'jsonb','V65 discovers public alliances');
select function_returns('public','arena_cancel_alliance_request',array['uuid'],'jsonb','V65 cancels own request');
select*from finish();
rollback;

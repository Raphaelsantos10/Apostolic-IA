begin;
select has_table('public','arena_alliances','V61 stores alliances');select has_table('public','arena_alliance_members','V61 stores alliance members');select has_table('public','arena_alliance_missions','V61 stores cooperative missions');select has_function('public','arena_create_alliance',array['text','text','text','text'],'V61 creates alliances securely');select has_function('public','arena_get_alliance_hub',array[]::text[],'V61 exposes private alliance hub');
rollback;

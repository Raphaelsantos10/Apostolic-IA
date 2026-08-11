begin;
select plan(3);
select function_returns('public','arena_get_alliance_settings',array[]::text[],'jsonb','V66 reads alliance settings');
select function_returns('public','arena_update_alliance_settings',array['text','text','integer'],'jsonb','V66 updates moderated policies');
select function_returns('public','arena_revoke_alliance_invite',array['text'],'jsonb','V66 revokes invites');
select*from finish();rollback;

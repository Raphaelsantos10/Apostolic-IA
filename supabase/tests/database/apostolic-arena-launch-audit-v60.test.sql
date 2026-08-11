begin;
select has_function('public','arena_admin_launch_audit',array[]::text[],'V60 exposes protected launch audit');
rollback;

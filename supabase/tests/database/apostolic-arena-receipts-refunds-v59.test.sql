begin;
select has_table('public','arena_refund_requests','V59 stores refund requests');
select has_function('public','arena_request_refund',array['uuid','text','text'],'V59 exposes user refund request');
select has_function('public','arena_admin_list_refund_requests',array[]::text[],'V59 exposes admin refund queue');
select has_policy('public','arena_refund_requests','arena_refund_requests_read_own','V59 requests remain private');
rollback;

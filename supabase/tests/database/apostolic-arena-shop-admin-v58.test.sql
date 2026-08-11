begin;
select has_function('public','arena_admin_list_shop_products',array[]::text[],'V58 exposes protected catalog listing');
select has_policy('storage','objects','arena_shop_assets_admin_insert','V58 protects image inserts');
select has_policy('storage','objects','arena_shop_assets_admin_update','V58 protects image updates');
rollback;

begin;
select plan(3);
select is((select metadata->>'image' from public.arena_shop_products where id='chest-alianca'),'/games/apostolic-arena/shop/v56/bau-alianca-v56.webp','baú usa arte exclusiva V56');
select is((select metadata->>'image' from public.arena_shop_products where id='gems-covenant'),'/games/apostolic-arena/shop/v56/gemas-alianca-v56.webp','pacote de gemas usa arte exclusiva V56');
select is((select metadata->>'image' from public.arena_shop_products where id='pass-alianca-s1'),'/games/apostolic-arena/shop/v56/passe-alianca-v56.webp','passe usa selo exclusivo V56');
select * from finish();
rollback;

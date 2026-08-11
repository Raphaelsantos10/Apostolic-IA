-- V56: assets exclusivos e nomes comerciais das coleções visuais.
-- Mantém preço, disponibilidade e regras de compra existentes.
update public.arena_shop_products as product
set metadata = product.metadata || visual.metadata
from (values
  ('skin-davi-rei', jsonb_build_object('image','/games/apostolic-arena/shop/v56/skin-leao-celestial-v56.webp','subtitle','Coleção Leão Celestial · apenas visual')),
  ('skin-elias-fogo-ceu', jsonb_build_object('image','/games/apostolic-arena/shop/v56/skin-manto-profeta-v56.webp','subtitle','Coleção Manto do Profeta · apenas visual')),
  ('chest-alianca', jsonb_build_object('image','/games/apostolic-arena/shop/v56/bau-alianca-v56.webp','subtitle','Relíquia dourada · épica garantida')),
  ('chest-real', jsonb_build_object('image','/games/apostolic-arena/shop/v56/bau-safira-v56.webp','subtitle','Cristal safira · raras e épicas')),
  ('effect-trombetas-jerico', jsonb_build_object('image','/games/apostolic-arena/shop/v56/effect-trombeta-v56.webp','subtitle','Coleção Vitória Dourada')),
  ('emote-noe-pomba', jsonb_build_object('image','/games/apostolic-arena/shop/v56/emote-pomba-v56.webp','subtitle','Coleção Sinais da Aliança')),
  ('pass-alianca-s1', jsonb_build_object('image','/games/apostolic-arena/shop/v56/passe-alianca-v56.webp')),
  ('gems-small', jsonb_build_object('image','/games/apostolic-arena/shop/v56/gemas-pequeno-v56.webp','subtitle','Bolsa do Peregrino')),
  ('gems-warrior', jsonb_build_object('image','/games/apostolic-arena/shop/v56/gemas-guerreiro-v56.webp','subtitle','Alforge do Guerreiro')),
  ('gems-king', jsonb_build_object('image','/games/apostolic-arena/shop/v56/gemas-rei-v56.webp','subtitle','Cofre do Rei')),
  ('gems-prophet', jsonb_build_object('image','/games/apostolic-arena/shop/v56/gemas-profeta-v56.webp','subtitle','Relicário do Profeta')),
  ('gems-covenant', jsonb_build_object('image','/games/apostolic-arena/shop/v56/gemas-alianca-v56.webp','subtitle','Cofre Monumental da Aliança'))
) as visual(id, metadata)
where product.id = visual.id;

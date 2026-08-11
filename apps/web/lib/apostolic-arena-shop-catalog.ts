import type { ArenaShopProduct } from "./apostolic-arena-economy-config";

export const ARENA_SHOP_CATALOG: readonly ArenaShopProduct[] = [
  { id: "skin-davi-guerreiro", category: "skins", name: "Davi Guerreiro", subtitle: "Skin rara · apenas visual", currency: "gems", price: 180, image: "/games/apostolic-arena/cards/art/common/001-davi-e-a-funda-v1.webp", rarity: "rare", featured: true },
  { id: "skin-davi-rei", category: "skins", name: "Davi Rei", subtitle: "Coleção Leão Celestial · apenas visual", currency: "gems", price: 350, image: "/games/apostolic-arena/shop/v56/skin-leao-celestial-v56.webp", rarity: "epic", featured: true },
  { id: "skin-moises-mar-vermelho", category: "skins", name: "Moisés · Mar Vermelho", subtitle: "Skin épica · apenas visual", currency: "gems", price: 350, image: "/games/apostolic-arena/cards/art/champion/117-moises-o-libertador-v1.webp", rarity: "epic" },
  { id: "skin-elias-fogo-ceu", category: "skins", name: "Elias · Fogo do Céu", subtitle: "Coleção Manto do Profeta · apenas visual", currency: "gems", price: 500, image: "/games/apostolic-arena/shop/v56/skin-manto-profeta-v56.webp", rarity: "legendary" },
  { id: "chest-alianca", category: "chests", name: "Baú da Aliança", subtitle: "Relíquia dourada · épica garantida", currency: "gems", price: 160, image: "/games/apostolic-arena/shop/v56/bau-alianca-v56.webp", rarity: "epic", featured: true },
  { id: "chest-real", category: "chests", name: "Baú Real", subtitle: "Cristal safira · raras e épicas", currency: "gems", price: 90, image: "/games/apostolic-arena/shop/v56/bau-safira-v56.webp", rarity: "rare" },
  { id: "effect-trombetas-jerico", category: "effects", name: "Trombetas de Jericó", subtitle: "Coleção Vitória Dourada", currency: "gems", price: 220, image: "/games/apostolic-arena/shop/v56/effect-trombeta-v56.webp", rarity: "epic" },
  { id: "effect-fogo-celestial", category: "effects", name: "Fogo Celestial", subtitle: "Efeito de entrada", currency: "gems", price: 280, image: "/games/apostolic-arena/cards/art/epic/091-coluna-de-fogo-v1.webp", rarity: "legendary", featured: true },
  { id: "emote-noe-pomba", category: "effects", name: "Noé e a Pomba", subtitle: "Coleção Sinais da Aliança", currency: "gems", price: 80, image: "/games/apostolic-arena/shop/v56/emote-pomba-v56.webp", rarity: "rare" },
  { id: "pass-alianca-s1", category: "pass", name: "Passe da Aliança", subtitle: "Trilha premium · sem poder de combate", currency: "money", price: 599, image: "/games/apostolic-arena/shop/v56/passe-alianca-v56.webp", rarity: "premium" },
  { id: "gems-small", category: "gems", name: "100 Gemas", subtitle: "Bolsa do Peregrino", currency: "money", price: 99, image: "/games/apostolic-arena/shop/v56/gemas-pequeno-v56.webp", rarity: "rare" },
  { id: "gems-warrior", category: "gems", name: "550 Gemas", subtitle: "Alforge do Guerreiro", currency: "money", price: 499, image: "/games/apostolic-arena/shop/v56/gemas-guerreiro-v56.webp", rarity: "epic" },
  { id: "gems-king", category: "gems", name: "1.200 Gemas", subtitle: "Cofre do Rei", currency: "money", price: 999, image: "/games/apostolic-arena/shop/v56/gemas-rei-v56.webp", rarity: "epic" },
  { id: "gems-prophet", category: "gems", name: "2.600 Gemas", subtitle: "Relicário do Profeta", currency: "money", price: 1999, image: "/games/apostolic-arena/shop/v56/gemas-profeta-v56.webp", rarity: "legendary" },
  { id: "gems-covenant", category: "gems", name: "7.000 Gemas", subtitle: "Cofre Monumental da Aliança", currency: "money", price: 4999, image: "/games/apostolic-arena/shop/v56/gemas-alianca-v56.webp", rarity: "premium" }
] as const;

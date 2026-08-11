import type { ArenaShopProduct } from "./apostolic-arena-economy-config";

export const ARENA_SHOP_CATALOG: readonly ArenaShopProduct[] = [
  { id: "skin-davi-guerreiro", category: "skins", name: "Davi Guerreiro", subtitle: "Skin rara · apenas visual", currency: "gems", price: 180, image: "/games/apostolic-arena/cards/art/common/001-davi-e-a-funda-v1.webp", rarity: "rare", featured: true },
  { id: "skin-davi-rei", category: "skins", name: "Davi Rei", subtitle: "Skin épica · apenas visual", currency: "gems", price: 350, image: "/games/apostolic-arena/cards/art/legendary/103-rei-davi-v1.webp", rarity: "epic", featured: true },
  { id: "skin-moises-mar-vermelho", category: "skins", name: "Moisés · Mar Vermelho", subtitle: "Skin épica · apenas visual", currency: "gems", price: 350, image: "/games/apostolic-arena/cards/art/champion/117-moises-o-libertador-v1.webp", rarity: "epic" },
  { id: "skin-elias-fogo-ceu", category: "skins", name: "Elias · Fogo do Céu", subtitle: "Skin lendária · apenas visual", currency: "gems", price: 500, image: "/games/apostolic-arena/cards/art/legendary/104-profeta-elias-v1.webp", rarity: "legendary" },
  { id: "chest-alianca", category: "chests", name: "Baú da Aliança", subtitle: "Épica garantida", currency: "gems", price: 160, image: "/games/apostolic-arena/chests/alliance-chest-v1.webp", rarity: "epic", featured: true },
  { id: "chest-real", category: "chests", name: "Baú Real", subtitle: "Raras e épicas", currency: "gems", price: 90, image: "/games/apostolic-arena/chests/golden-chest-v1.webp", rarity: "rare" },
  { id: "effect-trombetas-jerico", category: "effects", name: "Trombetas de Jericó", subtitle: "Efeito de vitória", currency: "gems", price: 220, image: "/games/apostolic-arena/cards/art/epic/077-trombetas-de-jerico-v1.webp", rarity: "epic" },
  { id: "effect-fogo-celestial", category: "effects", name: "Fogo Celestial", subtitle: "Efeito de entrada", currency: "gems", price: 280, image: "/games/apostolic-arena/cards/art/epic/091-coluna-de-fogo-v1.webp", rarity: "legendary", featured: true },
  { id: "emote-noe-pomba", category: "effects", name: "Noé e a Pomba", subtitle: "Emote da Aliança", currency: "gems", price: 80, image: "/games/apostolic-arena/cards/art/epic/088-noe-o-patriarca-v1.webp", rarity: "rare" },
  { id: "pass-alianca-s1", category: "pass", name: "Passe da Aliança", subtitle: "Trilha premium · sem poder de combate", currency: "money", price: 599, image: "/games/apostolic-arena/ui/emblems/alianca-v1.png", rarity: "premium", available: false },
  { id: "gems-small", category: "gems", name: "100 Gemas", subtitle: "Pacote Pequeno", currency: "money", price: 99, image: "/games/apostolic-arena/ui/currency/gema-celestial-v1.png", rarity: "rare", available: false },
  { id: "gems-warrior", category: "gems", name: "550 Gemas", subtitle: "Pacote Guerreiro", currency: "money", price: 499, image: "/games/apostolic-arena/ui/currency/gema-celestial-v1.png", rarity: "epic", available: false }
] as const;

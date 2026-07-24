# Temas claro, escuro e sépia

## Tokens principais

| Token | Claro | Escuro | Sépia | Uso |
| --- | --- | --- | --- | --- |
| `surface-page` | `#F8FAFC` | `#0B1220` | `#F4ECD8` | Fundo principal |
| `surface-panel` | `#FFFFFF` | `#131D2E` | `#FFF8E8` | Cartões e painéis |
| `surface-muted` | `#EEF2F7` | `#1C2940` | `#E9DEC3` | Áreas secundárias |
| `text-primary` | `#172033` | `#F4F7FB` | `#30281D` | Texto principal |
| `text-secondary` | `#4B5870` | `#B7C2D3` | `#645744` | Texto secundário |
| `border-default` | `#CBD5E1` | `#3A4961` | `#C7B898` | Limites |
| `action-primary` | `#174EA6` | `#78A9FF` | `#76521E` | Ação principal |
| `action-on-primary` | `#FFFFFF` | `#07101F` | `#FFFFFF` | Texto na ação |
| `focus-ring` | `#B45309` | `#FFD166` | `#174EA6` | Foco visível |
| `status-success` | `#18794E` | `#63D3A2` | `#397052` | Sucesso |
| `status-warning` | `#9A6700` | `#F4C95D` | `#855D17` | Aviso |
| `status-danger` | `#B42318` | `#FF8A80` | `#9B332B` | Erro |

Os valores são base inicial e devem passar por verificação automatizada e
manual de contraste antes da implementação.

## Tema claro

Prioriza leitura geral e superfícies limpas. Painéis não devem depender apenas
de sombra. Áreas extensas evitam branco excessivamente brilhante quando houver
preferência de conforto.

## Tema escuro

Usa fundo azul-escuro, não preto absoluto, para preservar níveis de superfície.
Texto principal evita branco absoluto em grandes blocos. Imagens e ilustrações
não devem emitir brilho excessivo.

## Tema sépia

Otimizado para leitura prolongada, com superfícies quentes e contraste estável.
Não altera imagens doutrinárias, mapas ou indicadores de estado por filtro
global.

## Preferência

- Respeitar inicialmente a preferência do sistema.
- Permitir escolha explícita entre claro, escuro, sépia e sistema.
- Guardar localmente sem exigir conta.
- Sincronizar futuramente somente com consentimento e conta.
- Evitar piscar o tema incorreto durante o carregamento.

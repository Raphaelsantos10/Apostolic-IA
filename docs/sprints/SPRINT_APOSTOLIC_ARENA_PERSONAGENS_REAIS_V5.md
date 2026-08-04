# Sprint Apostolic Arena — Dashboard Realista V5

## Objetivo

Substituir os quatro personagens geométricos provisórios do dashboard por figuras humanas fiéis às cartas de Moisés, Davi Rei, Sansão e Débora, mantendo Babylon.js, carregamento em tela cheia, catálogo, cartas e batalha Phaser existentes.

## Entregas

- cenário cinematográfico original do Salão dos Campeões;
- quatro figuras humanas recortadas das artes aprovadas;
- respiração, flutuação leve, sombra, iluminação e profundidade 2.5D;
- demonstração automática e ativação manual dos poderes;
- Moisés: abertura das águas e imunidade à paralisia por quatro segundos;
- Davi: ondas da harpa e bloqueio de ataque por três segundos;
- Sansão: frenesi e velocidade de ataque dobrada por quatro segundos;
- Débora: escudo de 200 HP para aliados;
- fallback geométrico para cartas que ainda não possuem figura preparada;
- batalha Phaser e baralho ativo preservados.

## Natureza visual

Os personagens são figuras humanas 2.5D inseridas numa cena Babylon.js real, com planos transparentes, profundidade, luz e efeitos 3D. Não são modelos volumétricos GLB e, portanto, a câmera permanece limitada a um arco frontal para conservar a fidelidade das artes.

## Validação esperada

```bash
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
```

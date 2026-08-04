# Sprint — Esquadrão principal 3D do Apostolic Arena (V3)

## Resultado

- O Salão dos Campeões exibe os quatro primeiros cards do baralho ativo como um esquadrão 3D.
- Cada ator recebe nome, custo de Fé, pedestal e cor vinculada à raridade da carta.
- O tipo e o nome da carta determinam um arquétipo visual e seu movimento.
- Atiradores executam preparação de disparo.
- Guardiões movimentam o escudo em postura defensiva.
- Suportes e profetas elevam o cajado e a energia.
- Unidades aéreas flutuam e batem as asas.
- Todos possuem respiração, oscilação e movimentos dessincronizados.
- A seleção é alimentada pela chave de baralho já existente e reage quando o deck muda.
- A implementação procedural é compatível com a substituição futura por modelos GLB animados.
- Batalha Phaser, catálogo e 125 artes permanecem inalterados.

## Validação

```bash
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
```

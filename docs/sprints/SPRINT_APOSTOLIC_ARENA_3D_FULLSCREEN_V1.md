# Sprint — Apostolic Arena 3D em tela cheia (V1)

## Resultado

- A aba Jogos continua oferecendo o Desafio Bíblico.
- O botão Apostolic Arena abre a experiência em tela cheia a partir do clique do jogador.
- Uma cena Babylon.js inicializa o motor 3D e alimenta o progresso real da tela de carregamento.
- O novo Salão dos Campeões funciona como menu principal 3D responsivo.
- Batalhar abre a arena Phaser já funcional, preservando regras, IA, torres, Fé, cronómetro e baralho.
- Cartas, Jornada e Baús são acessíveis sem sair da experiência em tela cheia.
- O menu consome `ARENA_CARD_CATALOG`; portanto, não substitui as artes nem limita o catálogo existente.

## Compatibilidade e decisões

- Navegadores só permitem iniciar tela cheia depois de uma ação explícita do utilizador. Por isso, a ativação ocorre no clique em Apostolic Arena e existe um botão de recuperação caso o navegador negue a primeira tentativa.
- Esta V1 usa geometria 3D procedural leve. Modelos GLB criados no Blender podem substituir o campeão e o cenário sem alterar o fluxo do menu.
- A batalha permanece 2D/Phaser nesta etapa para não interromper o protótipo funcional. A migração para combate 3D deve ser incremental.
- A preferência `prefers-reduced-motion` é respeitada nas animações de interface.

## Arquivos do patch

- `apps/web/components/apostolic-arena-3d-scene.tsx`
- `apps/web/components/apostolic-arena-3d-experience.tsx`
- `apps/web/components/apostolic-arena-3d-experience.module.css`
- `apps/web/components/games-hub.tsx`
- `apps/web/package.json`
- `pnpm-lock.yaml`

## Validação

```bash
corepack pnpm install
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
```

## Próxima etapa recomendada

Converter uma arena e quatro unidades representativas para GLB, acrescentar as animações `idle`, `walk`, `attack`, `hit` e `death`, e ligar esses atores às regras existentes antes de expandir o processo para as 125 cartas.

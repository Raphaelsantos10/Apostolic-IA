# Apostolic Arena V20.5 — Jornada das Arenas

> Requer a instalação da V20.3, que contém as oito maquetes e os dezesseis campos competitivos.

## Entrega

- As oito maquetes aparecem no Caminho da Aliança.
- Arena atual determinada por nível e troféus.
- Arenas futuras exibem cadeado e requisitos.
- Painel ampliado mostra história, clima, cartas e recompensas.
- Cada Arena apresenta os seus dois campos competitivos e estilos de torre.
- O botão de batalha só funciona na Arena atual.
- A entrada usa a apresentação cinematográfica da V20.3 e sorteia um campo 50/50.
- Ouro, XP, troféus, baús e limites de derrota continuam usando a progressão existente.

## Instalação

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-jornada-8-arenas-v20-5.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Abra a aba **Jornada**, selecione diferentes arenas e teste **Batalhar nesta Arena** na arena atual.

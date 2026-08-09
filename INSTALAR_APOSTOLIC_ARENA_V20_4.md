# Apostolic Arena V20.4 — Coleção e carrossel do deck

## O que muda

- As oito cartas do deck deixam de ser comprimidas ou sobrepostas.
- O deck ativo funciona como carrossel horizontal em telas menores.
- Ao passar o mouse, a carta do deck sobe, amplia e fica à frente.
- A coleção mostra todas as cartas numa grade completa, sem limitar a altura.
- O jogador pode alternar entre grade confortável e compacta.
- Busca, filtros, cartas bloqueadas, detalhes, evolução e ordem manual do deck continuam funcionando.

## Instalação

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-colecao-carrossel-v20-4.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Abra a aba **Cartas** e teste em janela larga e estreita.

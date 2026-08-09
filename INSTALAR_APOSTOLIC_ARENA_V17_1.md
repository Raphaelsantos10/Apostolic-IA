# Instalar Apostolic Arena V17.1

Aplicar depois da V16.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-progressao-colecao-v17-1.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Teste

1. Abra **CARTAS** e confirme o fundo do Arquivo Celestial.
2. Confirme cartas conquistadas e cartas com cadeado.
3. Clique numa carta: o painel deve abrir no centro, nunca na lateral.
4. Verifique Vida, Dano, Alcance, Velocidade, Nivel, Copias e Ouro.
5. Feche clicando no X ou fora do painel.
6. Remova cartas ate deixar o deck incompleto.
7. Confirme que **BATALHAR** fica bloqueado e nenhuma carta e adicionada automaticamente.
8. Escolha manualmente oito cartas e sua ordem.
9. Salve e teste na arena.
10. Confirme que cartas bloqueadas nao entram no deck.
11. Teste uma evolucao quando houver Copias e Ouro suficientes.
12. Confirme que os decks antigos continuam desbloqueados pela migracao.

Nao faca commit antes da inspecao visual.


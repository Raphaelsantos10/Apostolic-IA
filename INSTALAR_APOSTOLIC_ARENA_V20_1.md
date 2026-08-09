# Instalar Apostolic Arena V20.1

Patch incremental: aplique depois da V20.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-16-campos-3d-v20-1.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Teste

1. Entre em Jornada e selecione cada Arena.
2. Confirme que aparecem dois campos com imagens e torres diferentes.
3. Inicie uma batalha e anote CAMPO 1 ou CAMPO 2.
4. Volte ao menu e inicie outra batalha: a outra variante deve aparecer.
5. Confira se personagens, barras, projeteis e interface aparecem sobre a arte.
6. Teste Galileia, Exodo, Jerico, Gideao, Jerusalem, Carmelo e Alianca em computador e telemovel.

Nao execute `git add .` antes do typecheck, build e inspecao visual.

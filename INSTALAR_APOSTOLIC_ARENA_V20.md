# Instalar Apostolic Arena V20

Patch incremental: aplique depois da V19.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-temas-fases-v20.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Teste

1. Entre em Jornada e clique nas oito Arenas.
2. Confira o nome, clima e as tres fases de cada cenario.
3. Inicie uma batalha e confira o nome da Arena e da fase no canto superior.
4. Confirme que terreno, luz, agua/obstaculo e decoracao correspondem ao tema atual.
5. Confirme que o campo continua com duas rotas, duas travessias e tres torres por lado.
6. Teste no telemovel e confirme que o nome do tema nao cobre cronometro ou torres.

Para testar Arenas avancadas sem jogar centenas de partidas, altere temporariamente apenas no DevTools os campos `trophies` e `playerLevel` do item `apostolic-arena-progression-v17`. Nao salve esse estado como dado de producao.

Nao execute `git add .` antes de validar typecheck, build e aparencia.

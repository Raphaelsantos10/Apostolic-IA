# Instalar Apostolic Arena V19

Patch incremental: aplique depois da V18.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-jornada-trofeus-v19.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Roteiro de teste

1. Abra o menu e confirme que Ouro, nivel e trofeus nao sao mais valores fixos.
2. Entre em **Jornada**.
3. Confira a Arena atual e o progresso ate a proxima Arena.
4. Colete a recompensa da Arena 1.
5. Tente coletar novamente: o botao deve permanecer como **Coletada**.
6. Clique nas oito Arenas e confira as cartas que entram nos baus em cada uma.
7. Abra **Cartas** e confirme o Ouro e as copias recebidas.
8. Termine uma batalha e volte ao menu para confirmar a atualizacao dos valores.

Nao execute `git add .` antes do typecheck, build e inspecao visual.

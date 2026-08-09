# Instalar Apostolic Arena V18

Patch incremental: aplique depois das versoes V17.1 e V17.2.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-baus-recompensas-v18.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Teste rapido

1. Abra Apostolic Arena e entre em **Baus**.
2. Clique em **+ Bau rapido de teste**.
3. Clique em **Coletar** e confira Ouro, copias e eventual carta nova.
4. Volte ao menu e confirme que o espaco ficou vazio.
5. Termine uma batalha com vitoria e confirme que surgiu um novo bau.
6. Inicie a abertura normal. Recarregue a pagina e confirme que o contador continuou.
7. Confirme que nao e possivel abrir dois baus simultaneamente.
8. Entre em **Cartas** e confira se Ouro e copias recebidos foram atualizados.

Nao execute `git add .` antes de validar o typecheck, o build e este roteiro visual.

# Instalar Apostolic Arena V20.2

Patch incremental: aplique depois da V20.1.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-calibracao-16-campos-v20-2.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Teste normal

1. Inicie duas batalhas na mesma Arena para testar Campo 1 e Campo 2.
2. Invoque unidades nas duas rotas.
3. Confirme a travessia das duas pontes/passagens.
4. Confirme que torres, barras de vida e projeteis estao alinhados.
5. Teste a area de invocacao perto das bordas e do rio.
6. Termine e reinicie a batalha; as torres devem reaparecer nas coordenadas corretas.

## Diagnostico

Abra `http://localhost:3000?arenaDebug=1` e entre na batalha. Linhas azuis mostram as travessias e etiquetas douradas mostram as seis coordenadas das torres. Grave a tela se algum marcador ainda precisar de ajuste fino.

Nao execute `git add .` antes do typecheck, build e inspecao dos dois campos.

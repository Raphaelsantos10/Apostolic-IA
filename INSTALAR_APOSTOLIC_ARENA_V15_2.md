# Instalar Apostolic Arena V15.2

Aplicar depois da V15.1 e da correcao V15.1.1.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-personagens-25d-v15-2.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Teste do baralho

1. Abra **CARTAS** e selecione exatamente oito cartas.
2. Volte ao menu e entre em **BATALHAR**.
3. Confirme o indicador `8/8 BARALHO ATIVO`.
4. Anote as quatro cartas iniciais e a proxima carta.
5. Use cartas sucessivamente e confirme que as oito selecionadas entram na rotacao.
6. Confirme que nenhuma carta externa aparece.
7. Troque o baralho e repita o teste.

## Teste 2.5D e poderes

- personagens perto da parte inferior ficam ligeiramente maiores;
- personagens distantes ficam menores;
- caminhada possui balanco e sombra no solo;
- ataque avanca na direcao do adversario;
- impacto mostra reacao e numero de dano;
- derrota reduz, inclina e remove a unidade;
- curadores restauram aliados proximos;
- guardioes recebem menos dano;
- unidades de ataque a distancia possuem maior alcance;
- enxames sao mais rapidos;
- efeitos e milagres causam impacto em area;
- raridade melhora os multiplicadores;
- Campeoes preservam as quatro habilidades exclusivas da V13.

Nao faca commit antes de testar as oito cartas de pelo menos dois baralhos diferentes.


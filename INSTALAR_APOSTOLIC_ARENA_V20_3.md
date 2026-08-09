# Apostolic Arena V20.3 — Apresentação das Arenas

Este patch adiciona oito maquetes 3D de apresentação e separa claramente **Arena** de **Campo competitivo**.

- A Arena é apresentada antes da partida.
- Cada Arena contém exatamente dois campos competitivos existentes.
- Ao entrar, o sistema sorteia um dos dois campos com probabilidade de 50%.
- O resultado do sorteio fica fixo durante a partida.
- “Batalhar novamente” realiza um novo sorteio.

## Instalação

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-apresentacao-8-arenas-v20-3.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Abra `http://localhost:3000`, entre no Apostolic Arena, monte oito cartas e pressione **BATALHAR**.

## Teste esperado

1. Aparece a maquete da Arena atual.
2. A tela informa que existem dois campos possíveis.
3. Ao pressionar **ENTRAR NA ARENA**, um dos dois é sorteado.
4. O cenário carregado corresponde ao campo sorteado.
5. Uma revanche realiza novo sorteio independente.

# Apostolic Arena V20.7 — Baús e desbloqueio real

## Entrega

- Quatro slots persistentes no menu e no Tesouro.
- Vitória recebe baú quando existe espaço vazio.
- Madeira, Prata, Ouro e Aliança possuem visual próprio.
- Um temporizador de abertura ativo por vez.
- Contagem continua mesmo com o navegador fechado.
- Revelação cinematográfica: Ouro e depois cada carta.
- Cartas novas são marcadas como desbloqueadas.
- Cópias entram no progresso de evolução.
- Pool de recompensas limitado pela Arena alcançada.
- Coleta protegida contra clique duplo e repetição.
- Aviso quando os quatro slots estão ocupados.
- Ferramenta de baú rápido disponível somente com `?arenaDebug=1`.

## Instalação

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-baus-recompensas-v20-7.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Para testar rapidamente, abra `http://localhost:3000?arenaDebug=1`, entre em **Baús** e use **Baú rápido de teste**.

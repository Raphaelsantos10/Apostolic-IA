# Validação da Sprint 025

Data: 27 de julho de 2026.

Estado: em andamento.

| Validação | Estado |
| --- | --- |
| Testes unitários de voz | Aprovados - 4 testes |
| Typecheck | Aprovado - 4 pacotes |
| Build web | Aprovado - 16 rotas |
| Build mobile web | Aprovado - 3 rotas estáticas |
| Inspeção visual desktop | Pendente |
| Inspeção visual telemóvel | Pendente |
| Checks do Draft PR nº 27 | Pendente |

## Cenários funcionais

- consentimento desativado impede o início do microfone;
- ditado atualiza o campo editável sem envio automático;
- permissão recusada preserva o fluxo textual;
- resposta permite iniciar, pausar, continuar e parar a leitura;
- quiz aceita número ou texto da opção após confirmação;
- navegador sem Web Speech API apresenta fallback completo;
- velocidade é limitada entre 0,5× e 2×.

Este documento será atualizado somente com resultados realmente executados.

## Comandos executados

```bash
pnpm --filter @apostolic-ia/web test
pnpm typecheck
pnpm --filter @apostolic-ia/web build
EXPO_NO_TELEMETRY=1 pnpm --filter @apostolic-ia/mobile build
bash scripts/validate-repository.sh
```

O navegador de inspeção remota bloqueou o acesso ao servidor local
`127.0.0.1`. Por esse motivo, nenhuma aprovação visual foi registada nesta
etapa.

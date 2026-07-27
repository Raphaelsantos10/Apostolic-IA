# Validação da Sprint 025

Data: 27 de julho de 2026.

Estado: aprovada.

| Validação | Estado |
| --- | --- |
| Testes unitários de voz | Aprovados - 4 testes |
| Typecheck | Aprovado - 4 pacotes |
| Build web | Aprovado - 16 rotas |
| Build mobile web | Aprovado - 3 rotas estáticas |
| Inspeção visual desktop | Aprovada por gravação |
| Inspeção visual telemóvel | Aprovada - Samsung Galaxy S20 Ultra emulado |
| Fallback sem microfone funcional | Aprovado |
| Transcrição real por microfone | Bloqueada por defeito no hardware; limitação registada |
| Checks do PR nº 27 | Aprovados - 3 checks |

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

## Inspeção visual

As gravações de 27 de julho de 2026 comprovaram:

- interface desktop no tema escuro sem cortes ou sobreposições;
- consentimento, início e interrupção da captura;
- mensagem de falha compreensível e fallback textual funcional;
- resposta visível com controles de ouvir, pausar e parar;
- preferências de voz e velocidade;
- Professor IA e Jogos em viewport Samsung Galaxy S20 Ultra;
- campos, alternativas, resposta oral e navegação móvel sem rolagem horizontal.

O microfone defeituoso do notebook impediu uma transcrição real bem-sucedida.
Essa limitação de hardware não foi registada como aprovação do cenário positivo;
o comportamento de falha e a continuidade textual foram comprovados.

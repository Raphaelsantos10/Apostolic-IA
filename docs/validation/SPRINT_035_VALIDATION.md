# Validação da Sprint 035

## Evidências automatizadas

- `pnpm --filter @apostolic-ia/web typecheck`: aprovado;
- `pnpm --filter @apostolic-ia/web test`: 39 testes aprovados;
- `pnpm --filter @apostolic-ia/web build`: aprovado;
- `bash scripts/validate-repository.sh`: aprovado;
- auditoria web local: cinco rotas aprovadas, incluindo
  `/dashboard-preview`.

## Controles verificados

- dashboard de produção preservado por feature flag;
- prévia nova disponível sem login em `/dashboard-preview`;
- alternativa estática quando o ativo Rive não foi configurado;
- dotLottie carrega apenas após ação explícita;
- `prefers-reduced-motion` desativa os runtimes animados;
- XP descreve atividades de aprendizagem, nunca espiritualidade;
- Professor IA mantém Bíblia como autoridade final;
- nenhuma alegação de conteúdo publicado ou endosso denominacional.

## Inspeção humana pendente

- [ ] desktop;
- [ ] tablet;
- [ ] mobile de 320 px;
- [ ] zoom de 200%;
- [ ] teclado;
- [ ] leitor de ecrã;
- [ ] movimento reduzido;
- [ ] desempenho em dispositivo representativo;
- [ ] comparação com o dashboard aprovado;
- [ ] originalidade e licença dos futuros ativos `.riv` e `.lottie`.

Este documento registra somente a validação técnica disponível. Não declara
conformidade integral com WCAG nem aprovação do conteúdo teológico.

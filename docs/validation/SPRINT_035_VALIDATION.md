# Validação da Sprint 035

## Evidências automatizadas

- `pnpm --filter @apostolic-ia/web typecheck`: aprovado;
- `pnpm --filter @apostolic-ia/web test`: 39 testes aprovados;
- `pnpm --filter @apostolic-ia/web build`: aprovado;
- `bash scripts/validate-repository.sh`: aprovado;
- auditoria web local: cinco rotas aprovadas, incluindo
  `/dashboard-preview`.

## Medição do build de animação

Medição local do build de produção em 31 de julho de 2026. Os nomes dos chunks
são gerados pelo bundler e podem mudar entre builds:

| Entrega | Tamanho bruto | Tamanho com gzip |
| --- | ---: | ---: |
| runtime principal Rive | 208.125 bytes | 58.505 bytes |
| runtime principal dotLottie | 155.713 bytes | 29.975 bytes |
| integração compartilhada de animação | 32.737 bytes | 9.553 bytes |
| celebração JSON autoral | 2.087 bytes | não aplicável |
| poster estático da Lumi | 12.508 bytes | não aplicável |

Os runtimes continuam carregados dinamicamente e condicionados às flags,
preferência de movimento e ação do utilizador. Esta medição não comprova
desempenho em dispositivo real; essa inspeção permanece pendente.

## Controles verificados

- dashboard de produção preservado por feature flag;
- prévia nova disponível sem login em `/dashboard-preview`;
- alternativa estática quando o ativo Rive não foi configurado;
- dotLottie carrega apenas após ação explícita;
- `prefers-reduced-motion` desativa os runtimes animados;
- XP descreve atividades de aprendizagem, nunca espiritualidade;
- Professor IA mantém Bíblia como autoridade final;
- pacote interno das oito aulas e quizzes conectado à Área de Estudos somente
  pelo endpoint local protegido de revisão;
- indisponibilidade do modo local não expõe o conteúdo em rascunho;
- carregamento, revisão desativada, erro e offline possuem retorno textual e
  acessível; erro e offline permitem nova tentativa;
- movimento do dashboard usa CSS progressivo, pausa com hover ou foco e é
  desativado por `prefers-reduced-motion`;
- cursos possuem carrossel horizontal com `scroll-snap` e navegação nativa;
- Lumi usa recorte PNG transparente no hero; flutuação e aura são desativadas
  pela preferência de movimento reduzido;
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

# Sprint 035 — Experiência visual de estudo

Estado: primeiro incremento implementado em ramificação empilhada sobre a
Sprint 034. Não autoriza publicação do Módulo 1.

## Objetivo

Transformar a referência visual aprovada numa experiência original da
Apostolic IA, preservando conteúdo, segurança, acessibilidade, progresso real
e limites honestos de gamificação.

A referência passa a orientar todo o produto conforme
`docs/design/APOSTOLIC_PRODUCT_VISUAL_ARCHITECTURE.md`. A Sprint 035 entrega a
fundação e não declara login, Bíblia, comunidade ou mobile já redesenhados.

## Primeiro incremento

- nova área de estudos em azul-marinho e dourado;
- quatro etapas navegáveis: Aprender, Bíblia guiada, Praticar e Avaliar;
- painel bíblico com ligação para leitura contextual;
- missão diária, sequência semanal e conquistas sem ranking espiritual;
- Professor IA com fontes visíveis e limites doutrinários explícitos;
- comportamento responsivo para desktop, tablet e telemóvel;
- runtime Rive React carregado somente quando existe ativo `.riv` autorizado;
- dotLottie original para uma celebração solicitada pelo utilizador;
- movimento reduzido respeitado com alternativa estática;
- rollout por `NEXT_PUBLIC_STUDY_EXPERIENCE_V2`;
- `/dashboard-preview` apresenta o incremento sem substituir o dashboard
  aprovado em produção.
- o dashboard inicial mantém a visão geral; a experiência detalhada de estudo
  fica dentro de `Cursos`, em vez de substituir a página inicial;
- a prévia permite revisar as duas camadas por
  `/dashboard-preview` e `/dashboard-preview?section=courses`.

## Uso responsável das animações

Rive é reservado a elementos interativos com estado, como a chama de
constância. dotLottie é reservado a microcelebrações curtas. CSS cobre apenas
transições simples de foco, seleção e elevação.

Nenhuma animação:

- atribui valor espiritual, chamado ou maturidade;
- impede o acesso a conteúdo;
- reproduz automaticamente quando o utilizador solicita movimento reduzido;
- utiliza ativo de terceiros sem licença e proveniência documentadas;
- substitui texto, estado semântico ou anúncio acessível.

## Pendências

- redesenhar e aprovar o ficheiro Rive autoral da personagem `Lumi`;
- realizar inspeção visual humana em desktop, 320 px e zoom de 200%;
- testar teclado, leitor de ecrã e movimento reduzido em navegador real;
- medir o custo dos chunks Rive e dotLottie;
- conectar a área central às oito aulas e quizzes da revisão local;
- criar as 24 capas autorais, uma por módulo, com aprovação editorial.

O Módulo 1 permanece em revisão. Este incremento não altera os gates humanos,
histórico-textuais, editoriais, legais, pedagógicos ou de acessibilidade.

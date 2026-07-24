# Decisões tecnológicas

## Linguagem e repositório

- TypeScript em modo estrito.
- Monorepo com workspaces `pnpm` e orquestração Turborepo.
- Versões exatas serão fixadas somente na Sprint 010.

Motivo: partilha de domínio, contratos, validações e ferramentas entre web,
mobile e backend sem duplicação.

## Web e PWA

- Next.js com App Router.
- Renderização adequada por rota.
- Manifesto e capacidades PWA adicionados na sprint própria.

Motivo: suporte oficial a aplicações web progressivas, acessibilidade,
renderização no servidor e organização por rotas.

## Mobile

- React Native com Expo e Expo Router.
- Development builds para produção; Expo Go apenas para aprendizagem e testes
  iniciais.

Motivo: aplicações Android e iOS em TypeScript, navegação universal e acesso
progressivo a capacidades nativas.

## Backend e dados

- PostgreSQL gerido por Supabase.
- Supabase Auth quando contas forem implementadas.
- Storage para mídia licenciada.
- Migrações SQL versionadas no repositório.
- RLS obrigatória em tabelas expostas.

Motivo: PostgreSQL padrão, autenticação integrada e políticas por linha que
fornecem defesa em profundidade.

## API e operações privilegiadas

- Leitura direta do cliente somente quando protegida por RLS.
- Operações administrativas, publicação, pagamentos e IA passam por funções de
  servidor.
- Contratos são validados na entrada e na saída.
- `service_role` nunca é usado no cliente.

## Conteúdo

- Conteúdo original em formato estruturado e versionado.
- Publicação separada de rascunho, revisão e aprovação.
- Referências e licenças registradas por item.
- Texto bíblico integral somente com licença ou domínio público comprovado.

## Inteligência artificial

- Nenhuma chamada direta do cliente ao fornecedor de IA.
- Gateway de servidor com autenticação, quotas, filtros e auditoria.
- Recuperação baseada apenas em fontes aprovadas.
- Resposta inclui referências, incerteza e canal de denúncia.
- Dados do utilizador não treinam modelos sem consentimento explícito.

## Observabilidade e testes

- Logs estruturados sem conteúdo sensível.
- Testes unitários do domínio.
- Testes de integração de banco e RLS.
- Testes de contrato.
- Testes de acessibilidade e fluxos críticos.
- Monitorização e alertas entram nas sprints de produção.

## Alternativas consideradas

- Uma única aplicação universal para web e mobile: adiada; web e mobile têm
  necessidades diferentes, mas partilharão domínio e tokens.
- Backend próprio completo desde o início: rejeitado por complexidade precoce.
- Banco não relacional: rejeitado porque cursos, progresso, avaliações,
  versões e auditoria são relacionais.
- Microserviços: rejeitados no início; um backend modular é suficiente.

## Gatilhos de revisão

- Custos ou limites operacionais incompatíveis.
- Requisitos de residência de dados.
- Necessidade comprovada de processamento especializado.
- Problemas de desempenho medidos.
- Mudança de regras das lojas ou de privacidade.
- Dependência de fornecedor sem caminho de exportação.

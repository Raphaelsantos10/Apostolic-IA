# Sprint 011 - Aplicação responsiva e PWA instalável

## Estado

🚧 Em andamento.

## Objetivo

Transformar a base web em uma aplicação responsiva instalável, com navegação
acessível, temas persistentes e suporte offline inicial.

## Entregas

- Shell responsivo para telemóvel, tablet e web.
- Navegação principal com cinco destinos.
- Temas sistema, claro, escuro e sépia.
- Manifesto web app.
- Ícones próprios normal e maskable.
- Service worker com cache versionado.
- Página de recuperação offline.
- Metadados para instalação.

## Critérios de aceite

- Build de produção Next.js aprovado.
- Manifesto possui nome, início, modo standalone, cores e ícones.
- Service worker é registrado apenas no cliente.
- Aplicação abre em largura mínima de 320 CSS px.
- Navegação funciona por teclado com foco visível.
- Tema é persistido localmente sem exigir conta.
- Movimento reduzido é respeitado.
- Navegação offline retorna shell visitado ou página de recuperação.
- Cache antigo é removido durante ativação.
- Conteúdos e recursos futuros continuam identificados como indisponíveis.

## Fora do escopo

- Conteúdo real de cursos.
- Bíblia licenciada.
- Conta, backend e sincronização.
- Notificações push.
- Atualização avançada em segundo plano.
- Publicação em produção ou lojas.

## Próximo passo

Instalar dependências, executar typecheck e build, abrir a aplicação localmente
e verificar manifesto, responsividade e modo offline.

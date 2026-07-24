# PWA do Apostolic IA

## Desenvolvimento

```bash
pnpm install --frozen-lockfile
pnpm dev:web
```

Abrir <http://localhost:3000>.

## Build

```bash
pnpm --filter @apostolic-ia/web build
pnpm --filter @apostolic-ia/web start
```

## Verificações

- Abrir `/manifest.webmanifest`.
- Confirmar registro de `/sw.js`.
- Testar largura de 320 CSS px, tablet e desktop.
- Navegar somente por teclado.
- Alternar os quatro modos de tema.
- Visitar páginas, desligar a rede nas ferramentas do navegador e recarregar.
- Confirmar que conteúdo não visitado recebe a página `/offline`.

## Limites do cache

O service worker guarda apenas recursos do mesmo domínio obtidos por `GET`.
Pedidos de API, dados privados e conteúdo licenciado exigirão estratégias
específicas em sprints futuras. Nenhuma resposta autenticada deve ser colocada
em cache público.

## Atualização

O nome do cache contém a versão da sprint. Alterações futuras devem aumentar a
versão para que caches antigos sejam removidos com segurança.

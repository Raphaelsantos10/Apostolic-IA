# Base de segurança para produção

## Estado

Primeiro incremento da Sprint 030. Estes controles reduzem a superfície de
ataque, mas não autorizam publicação em produção.

## Cabeçalhos web

Todas as rotas recebem:

- Content Security Policy;
- proteção contra enquadramento;
- bloqueio de detecção incorreta de conteúdo;
- política mínima de referência;
- política de permissões;
- isolamento de origem compatível com autenticação por janela.

HSTS é enviado somente em build de produção. O microfone permanece permitido
apenas para a própria aplicação por causa da acessibilidade de voz. Câmara,
geolocalização, pagamentos pelo navegador e USB permanecem desativados.

O CSP permite conexões HTTPS/WSS para Supabase e integrações de servidor. O
ambiente local mantém apenas as exceções necessárias para Supabase e runtime de
desenvolvimento. A remoção futura de `unsafe-inline` exige nonces por resposta.

## Cadeia de fornecimento

- Dependabot verifica pacotes npm semanalmente.
- Dependabot verifica GitHub Actions mensalmente.
- CodeQL analisa JavaScript e TypeScript em PRs, `main` e semanalmente.
- Atualizações maiores não são agrupadas automaticamente.

Dependabot e CodeQL complementam revisão humana; não substituem testes,
auditoria de licença, análise de impacto nem atualização controlada do lockfile.

## Comunicação privada

Relatos devem usar avisos privados de segurança do GitHub. Issues públicas não
devem conter exploração, credenciais, dados pessoais ou conteúdo pastoral.

## Próximas verificações

- matriz completa de RLS por tabela e função;
- proteção contra abuso nas rotas autenticadas;
- idempotência e validação dos webhooks;
- logs estruturados sem conteúdo privado;
- inventário de segredos por ambiente;
- auditoria de dependências e imagens de containers;
- plano de incidentes e observabilidade.

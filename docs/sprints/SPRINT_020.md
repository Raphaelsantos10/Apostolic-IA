# Sprint 020 — Experiência bíblica

## Estado

Em andamento na branch `sprint/020-experiencia-biblica`.

## Objetivo

Ampliar a plataforma bíblica com áudio, acesso offline, destaques privados,
mapas, linhas do tempo e contexto editorial, respeitando licenças, privacidade
e acessibilidade.

## Escopo

- leitura falada por síntese de voz;
- armazenamento local autorizado por licença;
- destaques privados sincronizados por conta;
- contexto editorial com fonte;
- cronologia publicada;
- mapa contextual esquemático;
- conteúdo demonstrativo autoral.

## Critérios de aceite

- [x] Áudio só é habilitado quando a licença permite.
- [x] Conteúdo offline só é guardado quando a licença permite.
- [x] Utilizador pode guardar e remover capítulo no dispositivo.
- [x] Destaques pertencem somente ao titular por RLS.
- [x] Contexto publicado apresenta fonte.
- [x] Cronologia possui período, ordem e referência.
- [x] Mapa possui coordenadas, descrição e aviso de precisão.
- [x] Interface é navegável por teclado e responsiva.
- [ ] Migração, seed e testes pgTAP aprovados localmente.
- [ ] Typecheck, build e validação final aprovados.
- [ ] Inspeção visual aprovada.
- [ ] Pull Request aprovado e incorporado à `main`.

## Entregas realizadas

- tabelas e políticas da experiência bíblica;
- painel de áudio e acesso offline;
- destaques privados;
- contexto, cronologia e mapa demonstrativos;
- testes de RLS e permissões;
- documentação técnica.

## Validação

Pendente da execução final prevista pela política de entrega.

## Limitações conhecidas

- síntese de voz depende das vozes instaladas no dispositivo;
- offline desta sprint guarda capítulos autorizados no navegador, sem pacote
  completo de tradução;
- mapas são esquemáticos, sem integração com provedor cartográfico;
- conteúdo real depende de licenciamento e revisão editorial.

## Decisões

- permissões de áudio e offline permanecem independentes;
- destaques são privados por padrão;
- mapas e datas aproximadas devem declarar limitações;
- nenhum dado fictício será apresentado como geografia ou cronologia bíblica real.

## Próximo passo

Executar validação completa, registrar evidências e abrir o Pull Request da
Sprint 020.

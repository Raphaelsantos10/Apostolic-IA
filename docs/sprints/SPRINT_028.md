# Sprint 028 - Plataformas, idiomas e offline

## Estado

Em desenvolvimento.

## Objetivo

Preparar Android, iOS e PWA para preferências regionais e sincronização offline
segura, sem colocar dados privados ou conteúdo restrito em cache público.

## Entregas

- identificadores candidatos para Android e iOS;
- detecção segura de `pt-PT`, `pt-BR`, `es` e `en`;
- validação de fusos IANA com fallback UTC;
- service worker restrito a shell e recursos públicos estáticos;
- registro privado de dispositivos;
- fila idempotente de mutações offline;
- RLS para impedir acesso entre utilizadores;
- política de conflitos e limites de licença;
- testes de schema e validação estática.

## Critérios de aceite

- [ ] Build e typecheck web/mobile aprovados.
- [ ] PWA não guarda API, autenticação ou respostas privadas.
- [ ] Aplicativos possuem configuração Android e iOS.
- [ ] Idioma pode ser detectado e posteriormente alterado.
- [ ] Datas persistem em UTC e preferências usam fuso IANA.
- [ ] Mutação repetida não cria operação duplicada.
- [ ] Dispositivos e filas pertencem somente ao titular.
- [ ] Testes Supabase e checks do GitHub aprovados.
- [ ] Inspeção em telemóvel, tablet e PWA concluída.

## Limites

Esta sprint prepara a base multiplataforma. Publicação nas lojas, assinatura
nativa, notificações push e processamento automático da fila exigem
credenciais, contas de loja e validação de produção.

## Rollback

Reverter os commits antes da incorporação. Em produção, desativar novos envios
antes de remover filas e preservar mutações ainda não processadas.


# Sprint 028 - Plataformas, idiomas e offline

## Estado

Concluída após testes locais, inspeção Android/PWA e checks do PR nº 30.

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

- [x] Build e typecheck web/mobile aprovados.
- [x] PWA não guarda API, autenticação ou respostas privadas.
- [x] Aplicativos possuem configuração Android e iOS.
- [x] Idioma pode ser detectado e posteriormente alterado.
- [x] Datas persistem em UTC e preferências usam fuso IANA.
- [x] Mutação repetida não cria operação duplicada.
- [x] Dispositivos e filas pertencem somente ao titular.
- [x] Testes Supabase e checks do GitHub aprovados.
- [x] Inspeção em Android e PWA concluída.

## Limites

Esta sprint prepara a base multiplataforma. Publicação nas lojas, assinatura
nativa, notificações push e processamento automático da fila exigem
credenciais, contas de loja e validação de produção.

O teste em dispositivo iOS permanece pendente por exigir iPhone, macOS ou build
remoto. Essa limitação está registrada e será validada antes da publicação na
App Store.

## Rollback

Reverter os commits antes da incorporação. Em produção, desativar novos envios
antes de remover filas e preservar mutações ainda não processadas.

# Plataforma, idiomas, fusos e sincronização offline

## Plataformas

O Apostolic IA mantém uma base comum para PWA, Android e iOS. Os identificadores
nativos são candidatos até a criação das contas de loja e não representam uma
publicação já realizada.

## Idiomas iniciais

- `pt-PT` — português de Portugal;
- `pt-BR` — português do Brasil;
- `es` — espanhol;
- `en` — inglês.

O idioma sugerido pelo dispositivo pode ser alterado pelo utilizador. Conteúdo
teológico só recebe uma nova tradução depois de revisão humana da versão
regional; tradução automática não publica doutrina.

## Fusos

Datas são armazenadas em UTC. Metas, lembretes e planos diários usam um nome de
fuso IANA, como `Europe/Lisbon` ou `America/Sao_Paulo`. Mudança de fuso não deve
duplicar progresso nem alterar a data original de uma atividade.

## Offline

O PWA guarda apenas shell e recursos públicos estáticos. API, autenticação,
respostas privadas e conteúdo com licença restritiva nunca entram no cache
público.

Alterações offline recebem um `client_mutation_id` idempotente, dispositivo,
entidade, operação e instante do cliente. A fila pertence ao utilizador por RLS.
Somente o backend poderá marcar uma mutação como aplicada, rejeitada ou em
conflito.

## Conflitos

- progresso: maior avanço válido vence, sem desfazer conclusão;
- favoritos: última intenção confirmada;
- notas: preservar ambas as versões e pedir decisão quando necessário;
- metas: versão mais recente confirmada pelo utilizador;
- destaques: última alteração por versículo, mantendo a nota anterior em
  conflito.

Nenhuma resolução pode misturar dados de contas ou dispositivos diferentes.


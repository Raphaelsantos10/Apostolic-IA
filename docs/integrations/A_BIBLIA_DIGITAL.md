# A Bíblia Digital — avaliação de integração

## Estado da fonte

O projeto `omarciovsena/abibliadigital` disponibiliza uma API REST e o código
do servidor sob licença BSD-2-Clause. O mantenedor anunciou que o site e as
APIs serão desativados em 1 de agosto de 2026. Por isso, o Apostolic IA não
depende deste serviço em produção e mantém a sua camada bíblica própria.

A licença do código da API não substitui a licença de cada tradução bíblica.
Nenhum texto deve ser importado, publicado, guardado offline ou usado em áudio
sem registo explícito dos direitos correspondentes em `bible_licenses`.

## Endpoints documentados

| Recurso | Método e endpoint |
| --- | --- |
| Livros | `GET /api/books` |
| Livro | `GET /api/books/:abbrev` |
| Versões | `GET /api/versions` |
| Capítulo | `GET /api/verses/:version/:abbrev/:chapter` |
| Versículo | `GET /api/verses/:version/:abbrev/:chapter/:number` |
| Versículo aleatório | `GET /api/verses/:version/random` |
| Pesquisa | `POST /api/verses/search` |

Pedidos anónimos eram limitados a 20 por hora e pedidos autenticados eram
descritos como ilimitados. Tokens nunca devem ser expostos no cliente.

## Decisão Apostolic IA

- usar `bible_versions`, `bible_books` e `bible_verses` como contrato interno;
- publicar somente versões com licença verificada e estado `published`;
- manter fornecedores externos atrás de adaptadores executados no servidor;
- não criar conta ou token automaticamente no serviço descontinuado;
- manter estados de carregamento, vazio, erro, offline e indisponibilidade;
- preservar o mesmo capítulo ao alternar entre Modo Livro e Modo Estudo;
- respeitar `allows_offline` e `allows_audio` por tradução.

## Camada unificada de fontes

O leitor combina três contribuições sem depender de três serviços externos:

- `damarals/biblias`: Almeida 1911 completa, 66 livros, em JSON e identificada
  pelo projeto como domínio público;
- `ThiagoMaia1/api-biblia`: referência de experiência para aceitar consultas
  humanas como `João 3:16`, abreviações e nomes sem acentos; o domínio `.tk`
  documentado não é usado como dependência de produção;
- `caneto/BibliaFree`: referência funcional para leitura offline, último
  capítulo, destaques, favoritos, sequência e devocional. Trata-se de um app
  Flutter, não de uma API bíblica adicional.

Os dados abertos ficam em `public/bibles/ALM1911`, enquanto traduções
licenciadas continuam servidas pelas tabelas do Supabase. O seletor apresenta
ambas por meio do mesmo contrato visual.

## Experiência implementada

### Modo Livro

- páginas duplas no computador e fluxo de página única no telemóvel;
- navegação por capítulo com animação curta de viragem;
- botões acessíveis e respeito a `prefers-reduced-motion`;
- tipografia, papel, lombada e numeração visual de páginas.

### Modo Estudo

- seleção individual de versículo;
- ações contextuais para copiar, destacar, comparar e perguntar à IA;
- destaques privados, áudio, offline, contexto, linha do tempo e mapa continuam
  subordinados às permissões da tradução e aos conteúdos editoriais publicados.

## Referências

- Repositório: <https://github.com/omarciovsena/abibliadigital>
- Documentação original:
  <https://github.com/omarciovsena/abibliadigital/blob/master/DOCUMENTATION.md>
- Licença do código:
  <https://github.com/omarciovsena/abibliadigital/blob/master/LICENSE.md>

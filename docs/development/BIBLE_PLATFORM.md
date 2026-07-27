# Plataforma bíblica

## Princípio de licenciamento

Uma versão só é pública quando o respectivo registro de licença está
`authorized` ou `authorized_limited`, permite leitura e a versão está
`published`. Pesquisa depende ainda de `allows_search`.

O seed utiliza exclusivamente a **Versão Demonstrativa Autoral (VDA)**, com
texto fictício identificado na interface. Ela valida o produto sem copiar ou
distribuir uma tradução bíblica.

## Componentes

- `bible_licenses`: direitos, permissões, territórios e evidência.
- `bible_versions`: edição, idioma, estado editorial e indicação de demo.
- `bible_books` e `bible_verses`: estrutura canônica e texto pesquisável.
- `reading_plans` e `reading_plan_days`: planos editoriais públicos.
- `user_reading_plans` e `reading_progress`: metas e progresso privados por RLS.
- `search_bible`: pesquisa textual limitada a versões autorizadas.

## Segurança e privacidade

- versões bloqueadas, em avaliação ou revogadas não são públicas;
- o conteúdo editorial é somente leitura para utilizadores comuns;
- adesão a planos e dias concluídos pertencem exclusivamente ao titular;
- pesquisa não contorna RLS nem permissões da licença;
- permissões de áudio e offline são exibidas e não são presumidas.

## Ativação de uma tradução real

Antes da publicação, preencher todos os campos exigidos por
`docs/legal/BIBLE_LICENSING_POLICY.md`, guardar a evidência documental fora do
repositório público quando necessário, revisar juridicamente o contrato e
validar os usos de leitura, pesquisa, comparação, áudio e offline separadamente.

## Limite da Sprint 019

Áudio, pacotes offline, destaques, mapas, linhas do tempo e contexto ampliado
pertencem à Sprint 020.

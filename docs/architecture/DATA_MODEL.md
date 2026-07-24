# Modelo de dados conceitual

## Convenções

- Identificadores UUID.
- Datas em UTC.
- Campos `created_at`, `updated_at` e, quando necessário, `deleted_at`.
- Conteúdo com estado, versão e locale.
- Relações explícitas e integridade referencial.
- Dados pessoais mínimos e separados de conteúdo público.

## Identidade

### profiles

- `id` ligado ao utilizador autenticado.
- nome de apresentação opcional.
- locale e fuso.
- estado da conta.

### preferences

- utilizador.
- tema, contraste, tamanho de texto e redução de movimento.
- preferências de comunicação e consentimentos versionados.

## Conteúdo

### courses

- título, resumo, nível, locale e estado editorial.
- versão, autor, revisor e data de publicação.

### modules

- curso, título, ordem e objetivos.

### lessons

- módulo, título, ordem, corpo estruturado e duração estimada.
- estado editorial, versão e referências.

### lesson_assets

- aula, tipo, localização, licença, autoria e texto alternativo.

### sources

- referência, tipo, autor, licença, localização e estado de aprovação.

### content_reviews

- conteúdo, revisor, decisão, observações e data.

## Avaliação

### quizzes

- curso ou aula, regra de aprovação e tentativas permitidas.

### questions

- quiz, enunciado, tipo, explicação e referência.

### question_options

- pergunta, texto, ordem e indicador de resposta correta protegido.

### quiz_attempts

- utilizador, quiz, início, conclusão, resultado e versão do quiz.

### quiz_answers

- tentativa, pergunta, resposta e correção.

## Progresso

### enrollments

- utilizador, curso, estado, início e conclusão.

### lesson_progress

- utilizador, aula, estado, percentagem e última posição.

### notes

- utilizador, aula, conteúdo e marca temporal opcional.

### favorites

- utilizador e alvo favoritado.

### daily_plans

- utilizador, data, itens e estado.

## Operação futura

### subscriptions

- utilizador, fornecedor, estado e referências externas mínimas.
- Nenhum dado completo de cartão.

### ai_interactions

- utilizador, contexto aprovado, modelo lógico, custos, fontes e estado de
  revisão.
- Conteúdo sensível separado ou minimizado.

### reports

- denunciante, alvo, categoria, descrição, estado e decisão humana.

## Políticas de acesso

- Conteúdo publicado: leitura pública conforme licença.
- Rascunhos: somente equipa editorial autorizada.
- Progresso, notas e favoritos: somente o próprio utilizador.
- Revisões: papéis editoriais específicos.
- Dados administrativos: nunca expostos diretamente ao cliente.
- Cada política RLS terá teste positivo e negativo.

## Retenção e eliminação

- Conta eliminada inicia processo rastreável de remoção ou anonimização.
- Dados financeiros seguem obrigações legais mínimas.
- Logs têm prazo definido e não armazenam conteúdo desnecessário.
- Backups respeitam política de expiração e pedidos de eliminação.

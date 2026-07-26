# Núcleo integrado de aprendizagem

## Dados privados

- `lesson_progress`: estado, percentagem e retomada.
- `lesson_notes`: anotações privadas.
- `lesson_favorites`: aulas favoritas.
- `daily_goals`: minutos, dias ativos e lembretes.
- `quiz_attempts`: tentativas corrigidas no servidor.
- `review_items`: fila de revisão espaçada.

Todas as tabelas pessoais usam RLS e ficam limitadas ao titular.

## Quizzes

Perguntas publicadas podem ser lidas, mas o índice correto não é concedido
diretamente ao cliente. A função `submit_quiz_answer` calcula o resultado,
registra a tentativa e agenda a próxima revisão.

## Metas saudáveis

Metas são configuráveis e podem ser desativadas. A estrutura não mede
espiritualidade nem publica hábitos pessoais.

## Próxima parte

A interface integrada apresentará progresso, favoritos, notas, meta diária,
quiz e itens de revisão dentro da experiência autenticada.

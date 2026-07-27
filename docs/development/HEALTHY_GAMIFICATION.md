# Gamificação saudável

## Regra central

Pontos representam somente aprendizagem verificável: aula concluída, resposta
correta e dia de leitura concluído. Fé, oração, chamado, comunhão e serviço
espiritual não recebem pontuação nem entram em ranking.

## Modelo

- `learning_point_events`: razão auditável e idempotente dos pontos;
- `gamification_profiles`: total, nível e sequências;
- `achievement_definitions` e `user_achievements`: conquistas pedagógicas;
- `mission_definitions`: objetivos opcionais de aprendizagem;
- `sync_healthy_gamification`: sincroniza somente dados já validados no banco.

## Pontuação

- aula concluída: 20 pontos;
- quiz correto: 10 pontos;
- dia de plano de leitura concluído: 10 pontos.

O cliente não escolhe quantos pontos recebe. A função segura consulta progresso
e tentativas já pertencentes ao utilizador e impede duplicação pela origem.

## Níveis e sequência

São dez níveis pedagógicos, calculados a cada 100 pontos. A sequência considera
dias com aprendizagem verificável. Uma pausa reinicia apenas o contador, sem
punição, culpa ou afirmação espiritual.

## Privacidade

Perfil, eventos e conquistas pertencem ao titular por RLS. Esta sprint não
publica rankings nem perfis. Comunidade e antiabuso pertencem à Sprint 022.

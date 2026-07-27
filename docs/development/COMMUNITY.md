# Comunidade segura

## Princípios

- participação voluntária e perfil privado por padrão;
- círculos privados visíveis somente a membros ativos;
- conteúdo comunitário não altera doutrina nem mede espiritualidade;
- ligas usam exclusivamente pontos de aprendizagem verificável;
- oração, fé, chamado, doações e práticas espirituais nunca são comparados.

## Modelo funcional

Um círculo possui proprietário, moderadores e membros. Círculos públicos aceitam
adesão pela função `join_public_circle`; círculos privados exigem convite ou
operação moderada futura. Publicações e comentários são visíveis somente a
membros ativos. Denúncias entram na fila do círculo e
`moderate_community_content` registra toda decisão.

## Antiabuso

- máximo de cinco publicações por dez minutos por conta;
- máximo de quinze comentários por dez minutos por conta;
- corpo, descrição e detalhes têm limites no banco;
- uma conta não pode denunciar duas vezes o mesmo alvo;
- conteúdo oculto continua disponível ao autor e aos moderadores.

## Ligas opcionais

`community_league_opt_ins` começa sem adesão. `get_community_leaderboard`
retorna somente contas que aceitaram participar, exibindo nome escolhido, nível
e pontos de aprendizagem.

## RLS

Todas as tabelas expostas habilitam e forçam RLS. Funções privilegiadas fixam
`search_path`, validam `auth.uid()` e concedem execução somente a autenticados.

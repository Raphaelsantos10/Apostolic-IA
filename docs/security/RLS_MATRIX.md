# Matriz inicial de Row Level Security

| Recurso | Visitante | Utilizador autenticado | Operação privilegiada |
| --- | --- | --- | --- |
| `profiles` | Sem acesso | Lê o próprio; altera campos permitidos | Servidor futuro |
| `preferences` | Sem acesso | Lê e altera apenas as próprias | Servidor futuro |
| `auth.users` | Sem acesso direto | Gerido pelo Supabase Auth | Supabase Auth |
| `community_circles` | Sem acesso | Públicos ou círculos dos quais é membro | Proprietário altera metadados |
| `community_circle_members` | Sem acesso | Membro vê participantes do próprio círculo | Proprietário/moderador via funções auditadas |
| `community_posts` / `community_comments` | Sem acesso | Apenas membros; autor gere conteúdo visível próprio | Moderador oculta ou remove via função |
| `community_reports` | Sem acesso | Denunciante vê a própria; moderador vê a fila do círculo | Ações geram auditoria |
| `community_league_opt_ins` | Sem acesso | Utilizador gere somente a própria adesão | Sem adesão por padrão |
| `game_profiles` / `game_sessions` / `game_answers` | Sem acesso | Titular lê somente os próprios dados | Correção no servidor |
| `ai_sources` / `ai_source_chunks` | Sem acesso | Lê somente fontes aprovadas | Aprovação editorial futura |
| `ai_conversations` / `ai_messages` / `ai_feedback` | Sem acesso | Titular gere somente os próprios dados | Chamada externa no servidor |
| `api_rate_limits` | Sem acesso | Sem acesso direto; usa função limitada ao próprio `auth.uid()` | Limpeza operacional futura |

## Regras obrigatórias

- Toda tabela exposta habilita e força RLS.
- Políticas usam `auth.uid()` como identidade.
- Papéis recebem apenas os privilégios mínimos.
- Estado da conta não é alterado diretamente pelo utilizador.
- `service_role` nunca aparece no navegador ou aplicação móvel.
- Cada política exige teste positivo e teste entre contas.

## Ameaças cobertas

- leitura ou alteração de dados de outra conta;
- elevação direta do estado da conta;
- acesso anónimo a dados pessoais;
- perfil sem vínculo com `auth.users`.
- abuso de APIs por chamadas simultâneas da mesma conta;
- leitura ou alteração direta dos contadores de limitação.

## Comunidade e antiabuso

- círculos privados exigem adesão ativa;
- publicações e comentários têm limites temporais por conta;
- denúncias aceitam um único alvo e não podem ser duplicadas;
- moderação exige papel de proprietário ou moderador e produz registo imutável;
- a liga expõe somente nome escolhido e pontos de aprendizagem após adesão explícita.

## Pendências

- moderação global administrativa;
- auditoria independente antes da produção.
- limitação distribuída adicional para tráfego anónimo na infraestrutura de borda.

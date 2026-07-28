# Resposta a incidentes

## Prioridades

1. Proteger pessoas e dados.
2. Conter o acesso indevido.
3. Preservar evidências mínimas sem ampliar a exposição.
4. Restaurar o serviço com validação.
5. Comunicar de forma factual e cumprir obrigações legais aplicáveis.

## Classificação

| Nível | Exemplo | Resposta inicial |
| --- | --- | --- |
| Crítico | segredo de produção exposto, acesso entre contas ou cobrança indevida | Imediata |
| Alto | autenticação indisponível ou webhook comprometido | Até 1 hora |
| Médio | degradação parcial sem exposição confirmada | No mesmo dia |
| Baixo | falha sem impacto em dados ou disponibilidade | Próximo ciclo |

## Procedimento

1. Abrir registo privado com data, responsável e `requestId`, sem conteúdo pessoal.
2. Conter: desativar função, revogar credencial ou bloquear implantação.
3. Avaliar alcance por métricas e metadados mínimos.
4. Corrigir em branch isolada e executar testes de segurança.
5. Restaurar gradualmente e observar regressões.
6. Comunicar às partes necessárias com linguagem aprovada.
7. Fazer revisão pós-incidente com causa, impacto, correção e prevenção.

## Exercício de mesa antes do piloto

Simular a exposição de `SUPABASE_SERVICE_ROLE_KEY`:

- marcar hora de deteção;
- localizar responsável e procedimento de rotação;
- descrever contenção sem usar uma chave real;
- confirmar atualização segura do ambiente;
- executar login, RLS, cobrança e IA;
- registar duração, lacunas e ações corretivas.

O exercício não revoga credenciais reais. A validação só é aprovada quando
data, participantes, resultado e ações pendentes forem acrescentados ao
documento de validação da Sprint 030.

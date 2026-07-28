# Inventário de segredos

## Princípios

- Segredos existem somente no gestor de segredos do ambiente de execução.
- Nenhum segredo usa prefixos `NEXT_PUBLIC_` ou `EXPO_PUBLIC_`.
- Valores reais não entram em Git, logs, capturas, issues ou documentação.
- Produção, homologação e desenvolvimento usam credenciais diferentes.
- A rotação invalida a credencial anterior depois da validação da nova.

## Inventário

| Variável | Classificação | Uso | Acesso mínimo | Rotação |
| --- | --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | Segredo | API Stripe no servidor | Rotas de cobrança | Ao suspeitar exposição ou trocar ambiente |
| `STRIPE_WEBHOOK_SECRET` | Segredo | Verificar assinatura do webhook | Rota de webhook | Ao recriar endpoint ou suspeitar exposição |
| `SUPABASE_SERVICE_ROLE_KEY` | Segredo crítico | Administração restrita | Somente funções de servidor aprovadas | Imediata em incidente; revisão trimestral |
| `OPENAI_API_KEY` | Segredo | Professor IA no servidor | Rota de IA | Ao suspeitar exposição; revisão trimestral |
| `NEXT_PUBLIC_SUPABASE_URL` | Público | Endereço da API Supabase | Web | Quando o projeto mudar |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Público | Cliente Supabase com RLS | Web | Conforme política do Supabase |
| `APP_BASE_URL` | Configuração | Redirecionamentos canónicos | Servidor | Quando domínio mudar |
| `OPENAI_MODEL` | Configuração | Modelo aprovado | Servidor | Após validação funcional e de custos |

## Responsabilidade

O responsável técnico mantém acessos e rotação. O responsável pelo produto
aprova mudanças que afetem cobrança ou IA. Nenhuma pessoa deve partilhar
valores reais em canais de suporte; confirma somente o nome da variável e o
ambiente afetado.

## Resposta a exposição

Revogar a credencial, gerar outra, atualizar o ambiente, validar o serviço,
pesquisar uso indevido e registar o incidente sem copiar o valor exposto.

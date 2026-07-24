# Sprint 003 - Arquitetura, dados e decisões tecnológicas

## Estado

🚧 Em andamento - arquitetura aprovada e pronta para validação e Pull Request.

## Objetivo

Definir uma arquitetura segura, evolutiva e multiplataforma antes da
implementação do monorepo, das aplicações e do backend.

## Entregas

- Visão arquitetural.
- Estrutura lógica do monorepo.
- Modelo de dados conceitual.
- Decisões tecnológicas e alternativas.
- Limites de segurança, privacidade, conteúdo e IA.
- Registros de decisão arquitetural.

## Fora do escopo

- Inicialização do monorepo.
- Instalação de dependências.
- Criação de banco ou migrações.
- Implementação de autenticação.
- Interface funcional.
- Integração real de IA.

## Critérios de aceite

- Cada componente possui responsabilidade clara.
- Dependências apontam para dentro do domínio, não para fornecedores.
- O MVP local funciona sem backend.
- A evolução para conta e sincronização está prevista.
- Dados pessoais e conteúdo público estão separados.
- RLS é obrigatória antes de acesso de cliente a dados.
- Segredos e chaves privilegiadas nunca chegam ao cliente.
- IA futura passa por serviço de servidor e fontes aprovadas.
- Alternativas e gatilhos de substituição estão documentados.
- README, roadmap e validação refletem o estado real.

## Próximo passo

Executar validação final, abrir o Pull Request e incorporar a entrega à `main`
depois do CI verde.

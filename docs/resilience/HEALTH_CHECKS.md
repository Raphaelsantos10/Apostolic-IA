# Health checks

## Endpoint

`GET /api/health` é um sinal de vida do processo web. Ele não autentica,
consulta banco, testa fornecedores nem lê segredos.

A resposta contém somente:

- `status`;
- nome técnico do serviço;
- data e hora.

O cabeçalho `x-request-id` permite correlação e `Cache-Control: no-store`
impede que um estado antigo seja reutilizado.

## Interpretação

Uma resposta `200` comprova somente que o processo web responde. Readiness de
banco, autenticação, Storage, cobrança e IA deve usar verificações internas
separadas, com limites e sem expor detalhes ao público.

## Privacidade

Nunca incluir utilizador, e-mail, IP, versão de segredo, URL privada, erro do
banco ou conteúdo teológico na resposta pública.

# Observabilidade com privacidade

## Correlação

O proxy valida ou gera `x-request-id`, encaminha-o ao servidor e devolve o mesmo
identificador na resposta. O valor serve para correlacionar uma falha entre
cliente, aplicação e fornecedor sem identificar a pessoa.

## Campos permitidos em eventos de erro

- data e hora;
- nome técnico do evento;
- `requestId`;
- tipo da exceção;
- estado HTTP, duração e nome da rota quando forem adicionados.

## Campos proibidos

- nome, e-mail, IP completo ou identificador da conta;
- tokens, cookies, chaves e cabeçalhos de autorização;
- perguntas, respostas, notas, orações ou conteúdo de conversas;
- texto bíblico licenciado, corpo de webhook ou dados de pagamento;
- mensagem e pilha completas de exceções em produção.

`server-observability.mjs` constrói um evento com lista fechada de campos. A
função não inclui `error.message` nem `error.stack`.

## Alertas mínimos para o piloto

- aumento de respostas `5xx`;
- indisponibilidade de login, banco, cobrança ou IA;
- repetição de `429`;
- falhas de assinatura de webhook;
- falha de checks, CodeQL ou auditoria de dependências.

Nenhum fornecedor externo de monitorização é obrigatório nesta sprint. A
integração futura deve passar por avaliação de privacidade e retenção.

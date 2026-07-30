# Auditoria editorial automatizada — Módulo 1

## Estado

`automated_checks_ready_human_review_pending`

O comando abaixo executa controles internos e reproduzíveis:

```bash
node scripts/audit-module-01-editorial.mjs
```

## O que o controle verifica

- oito aulas continuam como rascunho e com publicação bloqueada;
- enunciados dos quizzes não se repetem exatamente;
- alternativas da mesma questão não são idênticas;
- blocos extensos de prosa não se repetem exatamente entre aulas;
- mapas de fontes preservam a declaração de não reprodução;
- endereços de repositórios externos não aprovados não aparecem no módulo.

## O que o controle não comprova

O resultado `passed: true` não comprova originalidade jurídica nem substitui o
parecer editorial. O script:

- não acessa nem compara corpus externo protegido;
- não decide se uma paráfrase está próxima demais de uma obra;
- não verifica autoria de ideias comuns ou fatos históricos;
- não completa bibliografias;
- não concede licença para tradução bíblica ou multimédia;
- não autoriza publicação.

## Gate humano obrigatório

Um revisor editorial competente ainda deverá comparar legalmente estrutura,
redação, exemplos, atividades e avaliações com fontes selecionadas, registrar
o corpus e o método, examinar cada correspondência relevante e emitir parecer
humano para o commit congelado.


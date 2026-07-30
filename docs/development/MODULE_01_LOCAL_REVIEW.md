# Prévia local do Módulo 1

## Finalidade

Esta prévia permite ao responsável avaliar as oito aulas e os 72 itens de quiz
na aplicação antes dos pareceres finais. Ela não muda o estado editorial, não
publica conteúdo e não substitui o piloto.

## Ativação local

Em `apps/web/.env.local`, adicione:

```dotenv
MODULE_01_REVIEW_MODE=enabled
```

Depois execute a aplicação normalmente e abra `http://localhost:3000/dashboard`.
Na área **Cursos**, a prévia aparece antes do catálogo publicado.

## Proteções

- a API responde somente quando a variável está habilitada;
- o host deve ser `localhost` ou `127.0.0.1`;
- a variável não usa prefixo `NEXT_PUBLIC` e permanece no servidor;
- o pacote mantém `status: draft` e `publicationAllowed: false`;
- respostas e posição ficam somente no armazenamento local do navegador;
- não existe gravação de nota acadêmica, certificado, venda ou acesso público;
- desabilitada por padrão, a rota responde com `404`.

## Atualização do pacote

Depois de alterar qualquer aula ou quiz:

```bash
node scripts/build-module-01-review.mjs
node scripts/build-module-01-review.mjs --check
```

O primeiro comando recria o pacote; o segundo confirma que ele corresponde às
fontes editoriais.

## Desativação

Ao terminar a revisão, altere a variável para:

```dotenv
MODULE_01_REVIEW_MODE=disabled
```

Reinicie o servidor. A prévia deixa de aparecer e a API volta a responder com
`404`.

## Limite

O acesso local serve para avaliação visual, funcional, doutrinária, pedagógica
e de acessibilidade. Publicação continua dependente dos gates registrados no
plano final do Módulo 1.

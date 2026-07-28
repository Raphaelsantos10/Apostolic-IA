# Orçamentos de desempenho

## Orçamentos iniciais do piloto

| Métrica | Máximo |
| --- | ---: |
| Resposta do servidor | 800 ms |
| Largest Contentful Paint | 2.500 ms |
| Interaction to Next Paint | 200 ms |
| Cumulative Layout Shift | 0,10 |
| JavaScript inicial por página principal | 300 KiB |

São limites internos de engenharia, medidos em cenários documentados. Não são
promessas universais para toda rede ou dispositivo.

## Cenários obrigatórios

- página inicial sem sessão;
- login e criação de conta;
- dashboard nos modos Acadêmico e Aventura;
- abertura de aula e quiz;
- leitor bíblico;
- Professor IA com resposta local e externa;
- PWA em rede lenta e retorno do modo offline.

## Regras

- Preservar o design aprovado e evitar telas vazias.
- Imagens devem possuir dimensões e formatos adequados.
- Conteúdo essencial não pode depender de animação.
- Carregamento deve anunciar estado sem bloquear teclado ou leitor de tela.
- Uma regressão exige correção ou exceção documentada antes do merge.

`apps/web/lib/resilience.mjs` mantém os limites em formato testável. Medições
reais no navegador serão adicionadas ao segundo incremento.

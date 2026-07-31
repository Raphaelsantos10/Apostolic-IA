# Movimento e modernidade visual

## Objetivo

Dar ao Apostolic IA uma experiência contemporânea, serena e responsiva sem
transformar movimento em distração, recompensa espiritual ou requisito para
compreender o conteúdo.

## Referências de qualidade

- `https://60fps.design/`: referência de categorias de microinteração, estados,
  progresso, carregamento e transições;
- `https://land-book.com/`: referência de composição editorial, tipografia,
  cartões, responsividade e apresentação pública;
- `https://www.cosmos.so/`: referência de descoberta visual, pesquisa,
  coleções, proveniência e atribuição.

As referências orientam critérios, não reprodução. Layouts, animações, imagens,
textos, marcas e código de terceiros não devem ser copiados.

## Princípios Apostolic

1. **Propósito:** movimento explica mudança, hierarquia ou resultado.
2. **Serenidade:** sem excesso, urgência artificial ou competição espiritual.
3. **Controle:** o sistema e a preferência guardada podem reduzir movimento.
4. **Desempenho:** preferir `opacity` e `transform`; evitar bloquear interação.
5. **Consistência:** web e mobile usam duração, distância e curva equivalentes.
6. **Originalidade:** futuras ilustrações e personagens precisam de autoria,
   origem, licença e aprovação humana documentadas.
7. **Verdade:** nenhuma animação faz um recurso planejado parecer disponível.

## Tokens iniciais

| Token | Valor | Uso |
| --- | ---: | --- |
| `fast` | 120 ms | resposta de foco e apontador |
| `standard` | 200 ms | mudança simples de estado |
| `slow` | 320 ms | entrada curta de painel |
| `distance-small` | 4 px | resposta local |
| `distance-medium` | 12 px | entrada de painel |

O modo `enhanced` é controlado por
`NEXT_PUBLIC_APOSTOLIC_ENHANCED_MOTION`. O padrão continua `standard`.
Ativar o modo não pode contornar `prefers-reduced-motion` nem a preferência
`reduce_motion` guardada pelo utilizador.

## Aplicação na Sprint 032

- a entrada dos fluxos de conta recebe transição curta e não bloqueante;
- foco, erro e confirmação têm resposta visual sem depender apenas de cor;
- o dashboard aprovado não é redesenhado;
- personagens, grandes sequências e efeitos celebratórios permanecem fora do
  escopo;
- métricas e inspeção manual determinam se o modo enriquecido avança ao piloto.

## Gate para expansão

Antes de aplicar movimento a curso, quiz, progresso, Bíblia ou IA:

- testar teclado, zoom, reflow e leitor de tela;
- testar redução de movimento do sistema e da conta;
- verificar ausência de deslocamento de layout;
- verificar desempenho em dispositivo mobile representativo;
- obter aprovação visual e de acessibilidade;
- manter rollback por `feature flag`.

## Contrato da personagem Lumi

Lumi é uma guia pedagógica autoral. A personagem não representa o Espírito
Santo, não profetiza, não interpreta a vontade de Deus e não substitui Bíblia,
professor, pastor ou revisão humana.

O ativo Rive aprovado deve ser hospedado pelo próprio projeto em
`/characters/lumi/lumi.riv` e respeitar este contrato:

| Elemento | Nome |
| --- | --- |
| Artboard | `Lumi` |
| State machine | `lumi-ui` |
| Estado numérico | `mode` |
| Saudação | `triggerWave` |
| Celebração | `triggerChest` |
| Movimento reduzido | `reducedMotion` |

O primeiro corte animado é limitado a `idle`, `wave` e `celebrate`. Enquanto o
arquivo `.riv` não existir ou não estiver autorizado, a aplicação apresenta o
poster estático `/characters/lumi/poster.webp`. O poster também é obrigatório
quando o sistema ou a conta solicitarem redução de movimento.

`NEXT_PUBLIC_RIVE_LUMI_URL` habilita o arquivo Rive autorizado. A variável
anterior `NEXT_PUBLIC_RIVE_STUDY_FLAME_URL` permanece apenas como compatibilidade
temporária.

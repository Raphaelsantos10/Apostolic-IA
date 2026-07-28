# Design system do Apostolic IA

## Princípios

- **Clareza:** a próxima ação e a hierarquia devem ser evidentes.
- **Serenidade:** a interface apoia leitura e reflexão sem excesso visual.
- **Consistência:** o mesmo conceito mantém nome e comportamento.
- **Acessibilidade:** contraste, teclado, leitores de tela e ampliação são
  requisitos básicos.
- **Honestidade:** recursos planejados não parecem funcionais.
- **Originalidade:** identidade própria, sem reproduzir aparência de terceiros.

## Tokens

Componentes usam nomes semânticos como `surface`, `text-primary`,
`action-primary` e `border-focus`. Valores de cor pertencem ao tema. Isso
permite alterar aparência sem modificar o significado ou o componente.

## Tipografia

- Família principal: fonte de sistema legível, com alternativas locais.
- Texto base: 16 px equivalentes, ajustável pelo utilizador.
- Comprimento recomendado de leitura: 45 a 75 caracteres por linha.
- Entrelinha de texto longo: aproximadamente 1,5.
- Não usar apenas maiúsculas em textos longos.
- Hierarquia de títulos deve seguir a estrutura do documento.

## Espaçamento

Escala base: 4, 8, 12, 16, 24, 32, 48 e 64 unidades. Componentes devem preferir
essa escala para manter ritmo e facilitar adaptação.

## Formas

- Raio pequeno: controles compactos.
- Raio médio: campos, botões e cartões.
- Raio grande: painéis destacados.
- Forma circular: apenas avatares, indicadores ou ações reconhecíveis.

## Elevação

Sombras são discretas e não constituem a única indicação de limite. Interfaces
escuras usam também borda e diferença de superfície.

## Movimento

- Transições curtas ajudam a perceber mudança de estado.
- Nenhuma informação depende de animação.
- Movimento automático deve poder parar.
- `prefers-reduced-motion` elimina efeitos não essenciais.
- O contrato técnico e os limites de adoção estão em
  [`MOTION_SYSTEM.md`](MOTION_SYSTEM.md).

## Conteúdo

Rótulos começam com verbos quando representam ações. Mensagens de erro explicam
o problema e a recuperação. A interface não usa culpa, pressão espiritual ou
urgência artificial.

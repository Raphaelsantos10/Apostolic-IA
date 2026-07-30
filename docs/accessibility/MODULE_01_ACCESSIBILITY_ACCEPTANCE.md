# Aceite de acessibilidade — Módulo 1

## Estado

`implementation_and_testing_pending`

Este documento transforma o parecer de acessibilidade em critérios executáveis.
Não afirma conformidade WCAG 2.2 AA e não concede aprovação.

## Fonte e formatos

- Markdown versionado é a fonte editorial estruturada.
- PDF é material auxiliar e não será declarado acessível sem tags, idioma,
  ordem de leitura, títulos, listas, tabelas e marcadores validados.
- A plataforma será o meio principal do piloto.
- Conteúdo essencial não poderá existir somente em imagem, áudio ou vídeo.

## Conteúdo multimédia

Nenhuma mídia integra o módulo atual. Antes de adicionar:

| Tipo | Evidência obrigatória |
| --- | --- |
| Imagem informativa | alternativa textual equivalente e licença |
| Imagem complexa | resumo curto e descrição estruturada |
| Áudio | transcrição revisada e controle acessível |
| Vídeo | legendas sincronizadas, transcrição e audiodescrição quando necessária |
| Animação | conteúdo equivalente com movimento reduzido |

## Avaliações

- todas as ações devem funcionar por teclado;
- foco deve ser visível, lógico e restaurado após mudança de etapa;
- pergunta, alternativas, erro, explicação e estado devem ser anunciáveis;
- resposta não pode depender de arrastar, cor, som ou posição;
- não haverá limite obrigatório de tempo;
- pausa, retomada e tempo adicional não reduzem nota;
- nova tentativa equivalente permanece disponível segundo a regra pedagógica;
- progresso acadêmico não mede espiritualidade.

## Matriz de execução

| Verificação | Ambiente/evidência | Estado |
| --- | --- | --- |
| Estrutura de títulos e regiões | Inspeção semântica no player integrado | Pendente |
| Teclado e foco visível | Navegação completa sem rato | Pendente |
| Leitor de tela | Windows e combinação suportada | Pendente |
| Zoom de 200% | Navegador suportado | Pendente |
| Reflow a 320 CSS px | Navegador responsivo | Pendente |
| Espaçamento de texto | Sobrescrita conforme WCAG | Pendente |
| Movimento reduzido | Preferência do sistema | Pendente |
| Pausa e retomada | Sessão interrompida e restaurada | Pendente |
| Tempo adicional sem penalização | Configuração de adaptação | Pendente |
| Offline e reconexão | PWA e plataforma representativa | Pendente |
| Transcrição, legenda e alternativa | Quando cada mídia existir | Não aplicável nesta versão |

## Controles implementados para nova inspeção

- foco visível inclui botões, ligações, seletores, campos, áreas de texto e
  regiões focadas programaticamente;
- o resultado do quiz recebe foco e é anunciado como estado após a correção;
- o quiz informa explicitamente que não possui limite de tempo;
- pausa, revisão da aula e nova tentativa não reduzem pontuação por tempo;
- alternativas continuam como controles de rádio agrupados em `fieldset`;
- movimento reduzido permanece respeitado pela preferência do sistema.

Esses controles preparam a nova inspeção, mas ainda precisam de testes reais
com teclado, leitor de tela, zoom de 200% e largura de 320 CSS px.

## Critério de aprovação

O gate somente poderá ser aprovado quando:

1. o conteúdo estiver integrado em versão congelada;
2. todas as verificações aplicáveis tiverem responsável, data e resultado;
3. defeitos bloqueadores estiverem corrigidos;
4. houver teste com pessoas que utilizem teclado e leitor de tela;
5. o parecer humano de acessibilidade citar o commit testado;
6. nenhuma alteração material ocorrer depois do parecer.

## Evidência do piloto

O relatório do piloto deverá registrar ambiente, tecnologia assistiva, passos,
resultado, defeito, severidade e correção. Consentimento, privacidade e
remuneração de participantes deverão seguir o protocolo pedagógico.

## Limite honesto

Passar em auditorias automáticas ou nos checks do GitHub não comprova
conformidade WCAG 2.2 AA. Publicação permanece bloqueada.

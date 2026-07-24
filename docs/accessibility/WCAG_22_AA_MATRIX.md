# Matriz WCAG 2.2 A e AA

## Uso da matriz

Cada fluxo futuro deverá registrar **aplicável**, **não aplicável com
justificação**, **aprovado** ou **reprovado**, além de evidência e responsável.
O agrupamento abaixo orienta o projeto, mas não substitui o texto normativo.

| Área | Requisitos planejados | Evidência futura |
| --- | --- | --- |
| Alternativas textuais | Texto alternativo útil; decoração ignorada; controles nomeados | Inspeção e leitor de tela |
| Áudio e vídeo | Legendas, transcrição, audiodescrição e controles conforme o conteúdo | Revisão humana de multimédia |
| Estrutura | Títulos, listas, tabelas, rótulos e relações programáticas | Árvore de acessibilidade |
| Sequência e orientação | Ordem significativa; sem depender de forma, posição ou orientação | Teclado e inspeção |
| Contraste e cor | Contraste AA; informação não depende só de cor | Medição e revisão visual |
| Redimensionamento | Texto a 200%; reflow a 320 CSS px; espaçamento ajustável | Navegadores e dispositivos |
| Teclado | Toda função disponível; sem armadilha; atalhos controláveis | Teste somente por teclado |
| Tempo e movimento | Tempo ajustável; pausa; sem flashes; movimento desativável | Teste manual |
| Navegação | Saltar blocos; títulos; foco lógico; múltiplas formas de localizar | Teclado e leitor de tela |
| Foco | Visível e não totalmente oculto por conteúdo criado pelo autor | Teste em todos os estados |
| Ponteiro e toque | Alternativas a gestos e arrastar; cancelamento; alvo mínimo aplicável | Telemóvel, rato e toque |
| Idioma e leitura | Idioma da página e trechos; abreviações e linguagem apropriadas | Inspeção editorial |
| Previsibilidade | Navegação, identificação e ajuda consistentes; sem mudança inesperada | Comparação entre telas |
| Formulários | Rótulos, instruções, erros, sugestões e prevenção de falhas importantes | Teclado e leitor de tela |
| Entrada redundante | Não pedir novamente dados já fornecidos no mesmo processo | Teste dos fluxos |
| Autenticação | Alternativa a testes cognitivos e suporte a gestores de senha | Teste de cadastro e login |
| Compatibilidade | Nome, função, valor e mensagens de estado programáticos | Leitores de tela e inspeção |

## Critérios novos relevantes da WCAG 2.2

- **2.4.11 Foco não obscurecido (mínimo), AA:** o item focado não fica
  totalmente escondido por conteúdo criado pelo autor.
- **2.5.7 Movimento de arrastar, AA:** funcionalidade de arrastar possui
  alternativa de ponteiro simples.
- **2.5.8 Tamanho do alvo (mínimo), AA:** alvos atendem ao mínimo normativo ou
  a uma exceção válida; o design system busca 44 por 44 unidades quando viável.
- **3.2.6 Ajuda consistente, A:** mecanismos repetidos de ajuda mantêm ordem
  relativa consistente.
- **3.3.7 Entrada redundante, A:** dados já fornecidos são preenchidos ou
  selecionáveis, salvo exceções.
- **3.3.8 Autenticação acessível (mínimo), AA:** processos não dependem de teste
  cognitivo sem alternativa ou mecanismo de assistência.

## Bloqueios

- Crítico: impede tarefa essencial sem alternativa.
- Grave: viola critério A ou AA em fluxo importante.
- Moderado: dificulta uso, mas existe alternativa utilizável.
- Menor: melhoria sem bloqueio funcional imediato.

Falhas críticas e graves impedem release.

# Arquitetura visual unificada da Apostolic IA

## Decisão

A composição autoral aprovada em azul-marinho, dourado, luz, farol, cartões
editoriais e navegação lateral passa a orientar todo o produto. Ela não é apenas
uma referência para o dashboard: é a família visual compartilhada pelo site
público, autenticação, aplicação web, PWA e aplicação mobile.

As telas não serão cópias pixel a pixel umas das outras. Cada plataforma
preserva hierarquia, toque, teclado, reflow e desempenho adequados, mantendo os
mesmos tokens, componentes, iconografia, capas, tom editorial e estados.

## Mapa do produto

| Área | Função | Composição principal | Lumi |
| --- | --- | --- | --- |
| Site público | explicar a proposta e encaminhar para conta | farol, manifesto, cursos, recursos e planos | saudação curta e ajuda opcional |
| Cadastro e login | acesso seguro e recuperação | cartão claro sobre ambiente azul-marinho | orientação discreta, nunca sobre campos sensíveis |
| Dashboard inicial | visão geral da jornada | progresso, próximo estudo, cursos, versículo, atividade e comunidade | companhia contextual e sequência |
| Cursos | catálogo e percurso | filtros, capas autorais, módulos e progresso real | ajuda para escolher ou retomar |
| Área de Estudos | aula, Bíblia guiada, prática e avaliação | player da captura aprovada com quatro etapas | guia da tarefa e celebração curta |
| Bíblia | leitura, pesquisa, notas e planos | leitor amplo, contexto e ferramentas laterais | dicas de navegação, sem interpretar como autoridade |
| Professor IA | perguntas fundamentadas | resposta, fontes, limites e encaminhamento humano | indica estados técnicos; não fala em nome de Deus |
| Comunidade | círculos, tópicos e moderação | fórum, grupos, oração e avisos de segurança | acolhimento e orientação de uso |
| Perfil | preferências e acessibilidade | conta, tema, texto, contraste e movimento | demonstra a preferência escolhida |
| Mobile | jornada essencial em toque | navegação inferior, cartões empilhados e retomada | presença compacta e econômica |

## Hierarquia de navegação

1. O dashboard é sempre a página inicial autenticada.
2. “Continuar estudando” ou um cartão de curso abre a Área de Estudos.
3. A Área de Estudos pertence ao curso; ela não substitui o dashboard.
4. Bíblia, comunidade, Professor IA, progresso e perfil mantêm destinos
   próprios dentro do mesmo shell visual.
5. No mobile, a navegação inferior prioriza Início, Estudos, Cursos,
   Comunidade e Perfil; Bíblia e Professor IA permanecem acessíveis pela jornada
   e pelo menu expandido.

## Lumi e chama de constância

Lumi estará integrada de forma contextual em todas as áreas, mas haverá no
máximo uma personagem principal visível por contexto. Essa limitação reduz
distração, consumo de memória e ambiguidade.

Estados iniciais:

- `idle`: presença serena;
- `wave`: boas-vindas solicitada ou primeira visita;
- `guide`: indicação de próximo passo;
- `thinking`: processamento técnico;
- `celebrate`: conclusão acadêmica;
- `rest`: pausa, offline ou movimento reduzido.

A chama mede somente constância de estudo. Ela não mede fé, unção, santidade,
chamado, valor pessoal ou aprovação de Deus. Perder uma sequência não gera
culpa, punição espiritual ou mensagem coerciva.

## Interação e movimento

- Rive controla Lumi e elementos com estado.
- dotLottie atende microcelebrações curtas e autorais.
- CSS cuida de foco, seleção, elevação e transições simples.
- `prefers-reduced-motion` e `reduce_motion` substituem movimento por estados
  estáticos completos.
- nenhuma animação bloqueia conteúdo, foco, envio de formulário ou navegação;
- movimento enriquecido permanece atrás de feature flag e orçamento de
  desempenho.

## Entrega progressiva

| Sprint | Entrega visual |
| --- | --- |
| 035 | shell, dashboard inicial, Área de Estudos separada, poster e contrato da Lumi |
| 036 | login, cadastro, recuperação, perfil e Professor IA contextual |
| 037 | cursos, avaliações, revisão personalizada e estados de Lumi |
| 038 | Bíblia, leitor, planos, certificados e microcredenciais |
| 039 | comunidade, ajuda, moderação e experiência mobile representativa |
| 040 | site público moderno, PWA, animações finais e consistência multiplataforma |
| 041 | piloto, desempenho, acessibilidade, correções e publicação controlada |

Nenhuma etapa futura é declarada pronta por este documento. Cada área exige
implementação funcional, dados reais, testes, inspeção humana e evidência no PR.

## Controles permanentes

- Bíblia como autoridade final;
- IA sem doutrina, profecia ou decisão em nome de Deus;
- 66 livros no cânon protestante adotado pelo projeto;
- continuidade dos dons espirituais examinada pelas Escrituras;
- conteúdo autoral e aprovação humana;
- nenhuma cópia de materiais, interfaces, personagens ou marcas de terceiros;
- nenhuma falsa disponibilidade de cursos, áudio, vídeo ou recursos;
- RLS, privacidade, segurança, acessibilidade e modo offline preservados.

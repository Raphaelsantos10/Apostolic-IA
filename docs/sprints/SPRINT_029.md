# Sprint 029 - Dashboard e gamificação saudável

## Estado

Concluída para o escopo de visualização responsiva, sincronização privada e
modos de aprendizagem. A integração dos botões com as rotas finais permanece
no backlog de produto.

## Objetivo

Transformar a prévia visual aprovada em um dashboard capaz de apresentar dados
reais do utilizador autenticado sem medir fé, santidade, chamado, unção ou valor
pessoal.

## Entregas

- dashboard responsivo em azul-marinho e dourado;
- modo Acadêmico com foco direto no percurso;
- modo Aventura com sequência e missão de aprendizagem;
- preferência de modo guardada no navegador;
- progresso idêntico entre os dois modos;
- nome, cursos, aulas, sequência, atividades e missões carregados do Supabase;
- sincronização de gamificação baseada em atividades verificáveis;
- aviso explícito quando dados demonstrativos são apresentados;
- estados vazios para catálogo e atividade;
- atividade privada protegida pelas políticas RLS existentes;
- princípios e fases futuras documentados no backlog de expansão.

## Regras obrigatórias

- pontos e sequências representam somente atividades de aprendizagem;
- nenhum pagamento altera progresso, resposta, certificado ou posição;
- não existe ranking espiritual;
- o utilizador pode escolher o modo sem perder progresso;
- dados de uma conta não podem ser lidos por outra;
- conteúdos continuam sujeitos à aprovação humana doutrinária, pedagógica e
  editorial.

## Critérios de aceite

- [x] `pnpm typecheck`.
- [x] `pnpm build`.
- [x] Validação estática do repositório.
- [x] Três checks do GitHub aprovados.
- [x] Progresso autenticado sincronizado.
- [x] Alternância entre Acadêmico e Aventura.
- [x] Chama e missão exibidas somente no modo Aventura.
- [x] Progresso preservado entre os modos.
- [x] Inspeção em layout desktop.
- [x] Inspeção em layout móvel.
- [x] Linguagem da interface não mede espiritualidade.

## Limites

A rota continua identificada como `dashboard-preview` enquanto ocorre a
integração gradual com a navegação principal. Botões como “Ver progresso”,
“Continuar estudando”, itens laterais e navegação móvel ainda são elementos
visuais e não devem ser anunciados como fluxos concluídos.

A gravação de validação demonstra uma sessão autenticada. O fallback sem sessão
está implementado e identificado como demonstração, mas deve ser novamente
inspecionado antes da publicação pública.

## Rollback

Reverter os commits do PR nº 33 antes da incorporação. Depois da incorporação,
reverter o merge preservando as tabelas e eventos de aprendizagem já existentes.

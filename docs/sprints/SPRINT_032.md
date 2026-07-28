# Sprint 032 - Alpha, beta, piloto e Release Candidate

## Estado

Incremento técnico incorporado à `main` pelo PR nº 44 no commit `18a3b6a`.
Alpha integral, beta, piloto pedagógico e Release Candidate não foram aprovados
por este merge e continuam como gates futuros.

## Base

- `main` no commit `6ebdc54`;
- Sprint 031 incorporada pelo PR nº 43;
- dashboard aprovado disponível em `/dashboard-preview`;
- currículo e conteúdo piloto existentes, sem declarar o catálogo completo.

## Objetivo

Transformar os núcleos já implementados numa jornada integrada, testável e
honesta para Alpha, beta e piloto controlado, corrigir os bloqueadores
encontrados e preparar um primeiro Release Candidate recuperável.

## Escopo integrado

### 1. Verdade do repositório

- [x] Atualizar o README para o estado posterior à Sprint 031.
- [x] Registar objetivo, riscos, validação e rollback da Sprint 032.
- [x] Registar referências de modernidade como critérios, sem copiar terceiros.
- [x] Criar tokens de movimento, redução de movimento e ativação gradual.
- [x] Registar o sistema de estudo interativo como épico futuro governado.
- [ ] Inventariar rotas, integrações, conteúdo realmente publicado e PRs
  automáticos sem os misturar com esta sprint.

### 2. Alpha funcional

- [ ] Validar cadastro, login, encerramento e renovação segura da sessão.
- [ ] Integrar perfil, preferências e onboarding à jornada principal.
- [x] Promover o dashboard aprovado para a experiência autenticada.
- [x] Ligar o menu somente a destinos reais e acessíveis.
- [x] Manter os destinos funcionais dentro do shell visual aprovado.
- [x] Reinspecionar navegação, perfil e preferências após a unificação visual.
- [x] Conectar o catálogo publicado a notas, favoritos, quiz e progresso real.
- [x] Identificar explicitamente piloto funcional e demonstrações técnicas.
- [ ] Validar curso, módulo, aula, quiz, progresso, notas e favoritos.
- [ ] Validar leitor bíblico, plano de leitura e modo offline.
- [ ] Validar o professor de IA somente com fontes aprovadas e incerteza
  explícita.

### 3. Curso piloto

- [ ] Entregar um percurso pequeno de Fundamentos da Fé de ponta a ponta.
- [ ] Confirmar autoria, fontes, licença e originalidade.
- [ ] Registar aprovação doutrinária, pedagógica, editorial e de
  acessibilidade.
- [ ] Não apresentar disciplinas ainda não produzidas como disponíveis.

### 4. Plataformas

- [ ] Validar web e PWA em desktop e largura móvel.
- [ ] Validar uma plataforma mobile representativa com Expo.
- [ ] Testar sincronização, conflitos e recuperação após uso offline.
- [ ] Documentar diferenças ainda existentes entre web e mobile.

### 5. Beta e piloto controlado

- [ ] Definir grupo pequeno, consentimento e canal de suporte.
- [ ] Preparar roteiro de teste e formulário de feedback.
- [ ] Classificar problemas como P0, P1, P2 ou P3.
- [ ] Corrigir bloqueadores P0 e P1 antes do Release Candidate.
- [ ] Registar decisão humana de avançar, adiar ou reduzir o escopo.

### 6. Release Candidate

- [ ] Criar notas de versão candidatas sem declarar lançamento público.
- [ ] Gerar checksum, instruções de instalação e rollback.
- [ ] Repetir backup e restauração em ambiente isolado.
- [ ] Executar a validação completa uma vez antes do merge.
- [ ] Preparar a transição para a Sprint 033 sem publicar automaticamente.

## Definição de pronto

- jornada integrada aprovada no web/PWA;
- fluxo representativo aprovado no mobile;
- curso piloto aprovado por revisão humana;
- testes de banco, typecheck, build e scripts de validação verdes;
- CodeQL e checks do Pull Request aprovados;
- teclado, zoom, reflow e leitor de tela inspecionados;
- backup, restauração e rollback testados;
- zero bloqueadores P0 ou P1 conhecidos;
- evidências e limitações registadas.

## Restrições

- não redesenhar o dashboard aprovado;
- não alterar a constituição doutrinária nesta sprint;
- a Bíblia permanece a autoridade final e a IA não cria doutrina;
- não copiar conteúdo proprietário de terceiros;
- não declarar todos os cursos como prontos;
- não ativar cobrança real sem validação jurídica, fiscal e operacional;
- não incorporar atualizações automáticas de dependências sem revisão isolada;
- não expor `.env`, tokens, senhas ou chaves.

## Riscos

- integrar telas de demonstração sem dados reais;
- confundir estrutura técnica com produto pronto;
- sessão local inválida esconder falhas de autenticação;
- conteúdo piloto sem todas as aprovações humanas;
- divergência entre web, PWA e mobile;
- crescimento de escopo impedir o piloto.

## Rollback

Reverter os commits desta sprint antes do merge. Mudanças de dados devem ter
migração reversível ou procedimento documentado. O Release Candidate não será
publicado automaticamente e a Sprint 033 permanece como gate de lançamento.

## Resultado após o merge

O incremento incorporado integrou dashboard, navegação e jornada técnica do
curso piloto, além de registar o épico de estudo interativo. O merge não
equivale a lançamento público, aprovação do seminário completo ou conclusão do
piloto pedagógico. As caixas ainda abertas permanecem como limitações e serão
tratadas progressivamente nas Sprints 033 a 040.

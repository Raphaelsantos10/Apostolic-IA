# Validação da Sprint 032

## Estado

Em preparação. Nenhuma aprovação de Alpha, beta, piloto ou Release Candidate
foi registada ainda.

## Baseline confirmada

- `main` no commit `6ebdc54`;
- Sprint 031 concluída e PR nº 43 incorporado;
- README corrigido como primeiro commit da Sprint 032;
- dashboard aprovado preservado em `/dashboard-preview`;
- sistema inicial de movimento acessível protegido por ativação gradual;
- catálogo teológico completo ainda não foi declarado como disponível.

## Validação automática

- [x] testes dirigidos dos incrementos aprovados;
- [x] teste do modo padrão, enriquecido e redução de movimento;
- [x] testes completos do banco aprovados;
- [x] typecheck aprovado;
- [x] build web e export mobile aprovados;
- [x] `scripts/validate-repository.sh` aprovado;
- [x] `scripts/validate-sprint-032.sh` aprovado;
- [x] CodeQL aprovado no incremento Alpha atual;
- [x] checks do Pull Request aprovados no incremento Alpha atual.

## Jornada Alpha

- [ ] cadastro e confirmação de conta;
- [ ] login, logout, sessão expirada e recuperação;
- [ ] onboarding, perfil e preferências;
- [ ] dashboard com dados reais e fallback honesto;
- [ ] curso piloto, aula, quiz e progresso;
- [ ] leitor bíblico e plano de leitura;
- [ ] professor de IA fundamentado em fontes aprovadas;
- [ ] offline, reconexão e sincronização;
- [ ] plataforma mobile representativa.

## Revisão humana

- [ ] aprovação doutrinária do curso piloto;
- [ ] aprovação pedagógica;
- [ ] aprovação editorial e de originalidade;
- [ ] aprovação de acessibilidade;
- [x] inspeção por teclado e foco;
- [x] zoom a 200% e reflow a 320 CSS px;
- [ ] leitor de tela em fluxo representativo;
- [x] inspeção visual web em largura desktop e mobile.

## Evidência do sistema de movimento

Inspeção manual realizada sobre o commit `126df4c`:

- movimento padrão: aprovado;
- movimento enriquecido: aprovado;
- movimento reduzido: aprovado;
- teclado: aprovado;
- zoom a 200%: aprovado;
- largura de 320 CSS px: aprovada;
- dashboard aprovado: preservado.

Os cinco checks do Pull Request passaram nesse commit. O incremento Alpha de
navegação deve repetir CodeQL e todos os checks antes de qualquer merge.

## Correção de continuidade visual

- [x] vídeo de inspeção identificou alternância para o shell antigo;
- [x] rotas funcionais foram integradas ao shell do dashboard aprovado;
- [x] perfil e preferências permanecem no dashboard após guardar;
- [x] correção reinspecionada manualmente em desktop e mobile;
- [x] CodeQL e checks do Pull Request aprovados no commit da correção.

Inspeção manual realizada depois do commit `7a0c0ab`:

- dashboard preservado durante toda a navegação;
- Cursos, Bíblia, Professor IA, Jogos, Comunidade e Progresso aprovados;
- perfil e preferências aprovados sem retorno ao shell antigo;
- teclado, zoom a 200% e largura móvel de 320 CSS px aprovados.

O banco local aprovou 18 arquivos e 149 testes. Os cinco checks do Pull Request,
incluindo CodeQL e build, também foram aprovados. Estas evidências confirmam o
incremento de navegação; não constituem aprovação integral do Alpha, beta,
piloto ou Release Candidate.

## Beta e piloto

- [ ] grupo e consentimento registados;
- [ ] feedback recolhido sem dados sensíveis desnecessários;
- [ ] problemas classificados por prioridade;
- [ ] zero P0/P1 antes do Release Candidate;
- [ ] decisão humana de go/no-go documentada.

## Recuperação e Release Candidate

- [ ] backup com manifesto e checksum;
- [ ] restauração isolada sem divergência;
- [ ] instalação e rollback testados;
- [ ] notas de versão candidatas;
- [ ] limitações conhecidas publicadas;
- [ ] Release Candidate identificável e recuperável.

## Evidências a anexar

- comandos e resultados dos testes;
- commit e checks do Pull Request;
- dispositivos e navegadores usados;
- métricas de desempenho observadas;
- roteiro e resultado das jornadas;
- aprovações humanas;
- problemas conhecidos e decisão de piloto.

## Limites honestos

Alpha, beta e piloto não equivalem a lançamento público. A aprovação automática
não constitui certificação integral WCAG, SLA comercial ou aprovação
doutrinária. A Sprint 033 continua responsável pela publicação controlada.

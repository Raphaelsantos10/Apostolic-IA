# Apostolic IA

Plataforma internacional de estudos bíblicos individuais com cursos, Bíblia em
múltiplas traduções licenciadas, gamificação, acessibilidade e professor de IA
alinhado à visão cristã apostólica, batista e pentecostal.

## Estado atual do projeto

- **Última sprint concluída:** Sprint 002 - Requisitos e escopo do MVP.
- **Sprint atual:** Sprint 003 - Arquitetura, dados e decisões tecnológicas.
- **Branch atual:** `sprint/003-arquitetura-tecnologia`.
- **Estado:** em andamento; arquitetura inicial documentada.
- **Aplicação executável:** ainda não existe.
- **Última atualização:** 24 de julho de 2026.

## Regra permanente de continuidade

Este README é o ponto central para continuar o projeto, inclusive em outro chat.
Ao iniciar, avançar ou encerrar uma sprint, deve ser atualizado com:

- sprint e branch atuais;
- entregas realizadas;
- decisões aprovadas;
- validações executadas;
- limitações e pendências;
- próximo passo exato;
- link para o relatório detalhado da sprint.

Uma sprint só pode ser marcada como **concluída** neste README e no roadmap
depois de cumprir a [Definição de Pronto](docs/SPRINT_DELIVERY_POLICY.md), passar
pelas validações, ser aprovada em Pull Request e incorporada à `main`.

Trabalho parcial deve permanecer marcado como **em andamento**.

## Controlo das sprints

| Sprint | Estado | Entrega | Evidência |
| --- | --- | --- | --- |
| 000 | ✅ Concluída | Fundação, roadmap, validação, backup e governança | [Relatório](docs/sprints/SPRINT_000.md) |
| 001 | ✅ Concluída | Constituição Doutrinária Apostólica Batista Pentecostal | [Relatório](docs/sprints/SPRINT_001.md) |
| 002 | ✅ Concluída | Requisitos do produto e escopo do MVP | [Relatório](docs/sprints/SPRINT_002.md) |
| 003 | 🚧 Em andamento | Arquitetura, dados e decisões tecnológicas | [Relatório](docs/sprints/SPRINT_003.md) |
| 004-094 | ⬜ Planejadas | Entregas sequenciais | [Roadmap](ROADMAP.md) |

## Entregas atuais da Sprint 003

- Arquitetura lógica e limites dos componentes.
- Estrutura futura do monorepo.
- Modelo de dados conceitual.
- Decisões de web, mobile, backend, dados, autenticação e IA.
- Registros de decisão arquitetural.

## Pendências da Sprint 003

- Rever riscos, alternativas e critérios de substituição tecnológica.
- Confirmar que a arquitetura suporta o MVP sem antecipar implementação.
- Preparar validação, release e Pull Request.

## Próximo passo exato

Rever `docs/architecture/OVERVIEW.md`, `DATA_MODEL.md` e
`TECHNOLOGY_DECISIONS.md`.

## Como continuar em outro chat

Forneça o repositório `https://github.com/Raphaelsantos10/Apostolic-IA` e use:

> Continue o Apostolic IA a partir do estado registrado no README. Leia também
> ROADMAP.md, docs/SPRINT_DELIVERY_POLICY.md, docs/sprints/SPRINT_003.md e
> CHANGELOG.md. Respeite a ordem das sprints e atualize o README antes de
> encerrar qualquer entrega.

## Princípios

- A Bíblia é a autoridade final de fé e prática.
- A IA não cria doutrina e não substitui revisão teológica humana.
- Cada sprint produz uma entrega versionada, validada e recuperável.
- `main` contém somente versões aprovadas.
- Traduções, imagens, mapas, áudios e vídeos exigem licença documentada.
- Acessibilidade, privacidade, segurança e sustentabilidade financeira são
  requisitos desde o início.

## Plataformas planejadas

- Web e PWA.
- Android e tablets Android.
- iPhone e iPad.
- Computadores e Chromebooks através da web.

## Documentação

- [Roadmap](ROADMAP.md)
- [Como contribuir](CONTRIBUTING.md)
- [Segurança](SECURITY.md)
- [Política de sprints](docs/SPRINT_DELIVERY_POLICY.md)
- [Política de validação](docs/VALIDATION_POLICY.md)
- [Instalação, atualização e rollback](docs/INSTALLATION_UPDATE_ROLLBACK.md)
- [Backup e recuperação](docs/BACKUP_RECOVERY.md)
- [Relatório da Sprint 000](docs/sprints/SPRINT_000.md)
- [Relatório da Sprint 001](docs/sprints/SPRINT_001.md)
- [Relatório da Sprint 002](docs/sprints/SPRINT_002.md)
- [Relatório da Sprint 003](docs/sprints/SPRINT_003.md)
- [Constituição Doutrinária](docs/doctrine/CONSTITUICAO_DOUTRINARIA.md)
- [Escopo do MVP](docs/requirements/MVP_SCOPE.md)
- [Histórias de utilizador](docs/requirements/USER_STORIES.md)
- [Matriz de aceite](docs/requirements/ACCEPTANCE_MATRIX.md)
- [Referências curriculares genéricas](docs/research/REFERENCIAS_CURRICULARES_PUBLICAS.md)
- [Validação da Sprint 002](docs/validation/SPRINT_002_VALIDATION.md)
- [Backup da Sprint 002](docs/backups/SPRINT_002_BACKUP_MANIFEST.md)
- [Visão da arquitetura](docs/architecture/OVERVIEW.md)
- [Modelo de dados](docs/architecture/DATA_MODEL.md)
- [Decisões tecnológicas](docs/architecture/TECHNOLOGY_DECISIONS.md)

## Validar

No Git Bash:

```bash
bash scripts/validate-repository.sh
```

## Licença

Todos os direitos reservados até a definição formal da estratégia de
licenciamento comercial.

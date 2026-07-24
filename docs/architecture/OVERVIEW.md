# Visão da arquitetura

## Princípios

- Começar simples e permitir evolução sem reescrever o domínio.
- Separar regras de negócio de frameworks e fornecedores.
- Compartilhar tipos, validações e tokens; não forçar interfaces idênticas.
- Privacidade, acessibilidade e segurança por padrão.
- Conteúdo original e versionado.
- Nenhuma funcionalidade futura apresentada como pronta.

## Plataformas

- **Web/PWA:** experiência principal inicial.
- **Android e iOS:** aplicações nativas futuras.
- **Backend:** API e funções de servidor para operações privilegiadas.
- **Dados:** PostgreSQL com políticas de acesso por linha.
- **Armazenamento:** mídia licenciada e ficheiros com políticas próprias.
- **IA:** serviço isolado, fundamentado e auditável em fase posterior.

## Componentes lógicos

```text
Web/PWA ─┐
         ├─ Cliente de domínio ─ Repositórios ─ Backend/PostgreSQL
Mobile ──┘                         │
                                  ├─ Conteúdo e mídia
                                  └─ Serviço de IA futuro
```

O MVP demonstrativo usará um repositório local de dados. As interfaces de
domínio deverão permitir trocar o adaptador local por backend remoto sem alterar
as regras de cursos, progresso e quizzes.

## Estrutura futura do monorepo

```text
apps/
  web/             Web responsiva e PWA
  mobile/          Android e iOS
packages/
  domain/          Entidades, regras e casos de uso
  schemas/         Validação e contratos
  content/         Formatos e ferramentas de conteúdo
  api-client/      Cliente tipado do backend
  design-tokens/   Cores, tipografia, espaços e temas
  config/          Configurações partilhadas
  testing/         Utilitários e fixtures
supabase/
  migrations/      Migrações SQL versionadas
  tests/           Testes de políticas e dados
docs/
  architecture/    Decisões e diagramas
```

## Fluxo do MVP local

1. A aplicação carrega catálogo e curso demonstrativo de conteúdo versionado.
2. O utilizador navega sem conta.
3. O progresso demonstrativo fica no dispositivo e é identificado como local.
4. O quiz usa perguntas originais e fornece explicações.
5. Planos aparecem apenas como “Em breve”.
6. IA, pagamentos e sincronização não são simulados.

## Evolução para backend

1. Implementar PostgreSQL, migrações e RLS.
2. Introduzir autenticação e perfil.
3. Migrar progresso local com consentimento.
4. Ativar sincronização entre dispositivos.
5. Adicionar mídia somente com licença.
6. Introduzir IA fundamentada atrás do servidor.

## Limites de confiança

- Cliente é ambiente não confiável.
- Chaves públicas não concedem acesso sem RLS.
- Chaves privilegiadas existem somente no servidor.
- Conteúdo publicado exige estado aprovado e versão.
- Dados privados pertencem ao utilizador e são filtrados por política.
- Saídas de IA são registros auditáveis, não fonte doutrinária.

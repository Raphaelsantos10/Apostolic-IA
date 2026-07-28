# Backup e recuperação

## Escopos independentes

- Repositório Git e tags.
- Base de dados.
- Autenticação.
- Storage de imagens, áudio e vídeo.
- Configurações sem expor segredos.
- Conteúdos teológicos e respetivas versões.
- Registos de licença.

## Regra

Um backup só é válido depois de uma restauração de teste em ambiente isolado.

## Antes de cada release

1. Registar versão e commit.
2. Criar backup remoto.
3. Gerar manifesto com data, origem e checksum.
4. Restaurar uma amostra ou ambiente isolado.
5. Registar duração e consistência.
6. Guardar evidência da validação.

## Objetivos iniciais

Durante o piloto controlado, os objetivos internos são:

- RPO de até 24 horas para dados persistentes;
- RTO de até 8 horas para restauração do serviço essencial;
- manifesto SHA-256 em cada conjunto de backup;
- exercício de restauração antes de cada release.

Esses valores são objetivos operacionais, não promessas comerciais. Só podem
ser revistos depois de medições reais documentadas.

## Integridade

`scripts/backup-manifest.mjs` gera e verifica um manifesto versionado com
tamanho e SHA-256 de cada ficheiro. O manifesto confirma integridade, mas não
substitui criptografia, controlo de acesso, retenção ou restauração testada.

O procedimento completo está em
`docs/resilience/BACKUP_RESTORE_RUNBOOK.md`.

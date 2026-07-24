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

RPO e RTO serão definidos antes da primeira versão com dados reais. Nenhuma
promessa comercial de recuperação será publicada antes de ser testada.

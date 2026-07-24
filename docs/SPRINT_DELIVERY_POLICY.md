# Política de entrega das sprints

## Branches

- `main`: versões aprovadas.
- `develop`: integração quando passar a ser necessária.
- `sprint/NNN-descricao`: uma sprint.
- `fix/descricao`: correção normal.
- `hotfix/vX.Y.Z`: correção urgente.

## Definição de Pronto

Uma sprint só está concluída quando:

- escopo e critérios de aceite foram cumpridos;
- testes aplicáveis estão verdes;
- build instalável foi gerado;
- documentação foi atualizada;
- migrações foram testadas quando existirem;
- licenças foram verificadas;
- não existem segredos versionados;
- backup anterior foi registado;
- rollback foi documentado e testado quando aplicável;
- release notes e limitações conhecidas foram publicadas;
- aprovação humana exigida foi registada.

## Release

Cada sprint aprovada deverá possuir:

- tag `vX.Y.Z-sprint-NNN`;
- pacote de código-fonte;
- build instalável aplicável;
- `RELEASE_NOTES.md`;
- `INSTALL.md`, `UPDATE.md` e `ROLLBACK.md`;
- relatório de validação;
- checksums SHA-256;
- manifesto de backup.

## Gate

Uma fase não avança enquanto suas decisões estruturais estiverem pendentes.
Correções não apagam sprints anteriores; usam subversão ou sprint corretiva.

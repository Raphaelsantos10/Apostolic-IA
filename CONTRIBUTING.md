# Como contribuir

## Fluxo

1. Atualize `main`.
2. Crie `sprint/NNN-descricao`, `fix/descricao` ou `hotfix/descricao`.
3. Faça alterações pequenas e rastreáveis.
4. Execute `bash scripts/validate-repository.sh`.
5. Atualize documentação e changelog.
6. Abra pull request.
7. Aguarde CI verde e revisão.
8. Faça merge sem reescrever histórico aprovado.

## Commits

Formato:

```text
tipo: Sprint NNN - descrição objetiva
```

Tipos permitidos: `feat`, `fix`, `docs`, `test`, `security`, `chore`, `refactor`.

## Proibições

- Nunca versionar `.env`, tokens, senhas ou chaves privadas.
- Nunca copiar traduções bíblicas ou imagens sem licença.
- Nunca publicar conteúdo de IA sem revisão definida.
- Nunca apresentar mock, hipótese ou demonstração como funcionalidade real.
- Nunca alterar a Constituição Doutrinária dentro de uma sprint técnica.

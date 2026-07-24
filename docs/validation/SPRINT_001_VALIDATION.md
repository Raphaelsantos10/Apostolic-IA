# Validação da Sprint 001

## Escopo

- Presença dos documentos obrigatórios.
- Ausência de segredos e marcadores de conflito.
- Consistência do estado registrado no README.
- Fontes doutrinárias identificadas.
- Fontes públicas tratadas apenas como referência, sem reprodução de conteúdo
  didático externo.

## Comandos

```bash
git diff --check
bash scripts/validate-repository.sh
sha256sum -c DELIVERY_CHECKSUMS.sha256
```

## Resultado

Pendente de execução no Git Bash e no GitHub Actions.

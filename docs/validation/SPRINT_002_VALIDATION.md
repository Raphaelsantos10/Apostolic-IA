# Validação da Sprint 002

## Escopo

- Presença dos documentos obrigatórios.
- Requisitos P0, P1 e P2 identificados.
- Histórias e critérios de aceite rastreáveis.
- Ausência de marcas externas na documentação pública.
- Ausência de segredos e marcadores de conflito.
- README coerente com a branch e a sprint.

## Comandos

```bash
git diff --check
bash scripts/validate-repository.sh
sha256sum -c DELIVERY_CHECKSUMS.sha256
```

## Resultado

Validação local aprovada em 24 de julho de 2026. GitHub Actions pendente.

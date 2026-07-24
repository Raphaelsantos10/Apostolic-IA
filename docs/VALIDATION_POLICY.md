# Política de validação

## Pipeline progressivo

As verificações serão adicionadas conforme o código surgir:

1. Integridade do repositório.
2. Segredos e arquivos proibidos.
3. Formatação e lint.
4. Tipagem.
5. Testes unitários.
6. Testes de componentes.
7. Integração.
8. E2E.
9. Build web, Android e iOS.
10. PWA e offline.
11. Acessibilidade.
12. Segurança e dependências.
13. Migrações e RLS.
14. Licenças de conteúdo.
15. Consistência doutrinária.
16. Smoke test.
17. Desempenho.
18. Manifesto, SBOM e checksums.

## Sprint 000

O validador inicial confirma:

- presença dos documentos obrigatórios;
- existência do roadmap e da Sprint 000;
- ausência de arquivos geralmente proibidos;
- ausência de padrões comuns de chaves privadas;
- ausência de marcadores de conflito Git.

## Evidência

Toda release deve guardar o comando executado, data, versão da toolchain,
resultado e limitações não testadas. “Passou” sem evidência não é aceite.

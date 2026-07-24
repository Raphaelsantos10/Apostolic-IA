# Validação da Sprint 008

## Estado

✅ Validação local e documental aprovada em 24 de julho de 2026.

## Escopo validado

- Protótipo estático aberto localmente no navegador.
- Navegação entre Início, Cursos, Bíblia, Progresso e Mais.
- Temas sistema, claro, escuro e sépia.
- Layouts conceituais de telemóvel, tablet e web.
- Estados demonstrativos e identificação de recursos planejados.
- Execução sem dependências, servidor ou Python.

## Evidências

- O utilizador confirmou que `prototype/index.html` abriu corretamente.
- HTML possui idioma, viewport, título e link para saltar ao conteúdo.
- JavaScript passou por verificação de sintaxe.
- Arquivos HTML, CSS e JavaScript estão versionados na branch.
- O protótipo não inclui textos bíblicos ou materiais externos protegidos.
- README registra que o protótipo não é aplicação funcional de produção.
- `git diff --check` sem erros.
- `scripts/validate-repository.sh` executado com sucesso.

## Verificações manuais futuras

- Redimensionar para 320, 768 e 1024 CSS px ou valores próximos.
- Navegar somente por teclado.
- Ampliar texto a 200%.
- Verificar preferência de movimento reduzido.
- Testar os três temas e a preferência do sistema.
- Inspecionar com leitores de tela nas combinações previstas.

## Limites

- Não há backend, conta, sincronização, Bíblia licenciada ou IA.
- A navegação é demonstrativa e não utiliza roteamento de produção.
- A validação não constitui declaração de conformidade WCAG.
- A conclusão depende de CI verde, aprovação e merge do Pull Request.

## Resultado

A Sprint 008 está pronta para Pull Request.

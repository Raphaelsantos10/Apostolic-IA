# Validação da Sprint 007

## Estado

✅ Validação documental aprovada em 24 de julho de 2026.

## Base verificada

- WCAG 2.2, Recomendação W3C.
- Níveis A e AA como objetivo do produto.
- Quatro princípios: perceptível, operável, compreensível e robusto.
- Critérios adicionais da WCAG 2.2 relevantes aos fluxos planejados.

## Escopo validado

- Política de acessibilidade.
- Matriz WCAG 2.2 A e AA.
- Plano de testes automáticos e manuais.
- Testes futuros com tecnologias assistivas e pessoas com deficiência.
- Diretrizes de conteúdo, multimédia, Bíblia e avaliações.
- Severidade e bloqueio de defeitos.

## Verificações

- A documentação distingue objetivo de alegação de conformidade.
- Ferramentas automáticas não são tratadas como prova integral.
- Falhas críticas e graves impedem release.
- Teclado, foco, zoom, reflow e leitores de tela possuem testes planejados.
- Novos critérios relevantes da WCAG 2.2 estão contemplados.
- Aplicações móveis herdam resultados funcionais acessíveis.
- README, roadmap e relatório refletem o estado real.
- `git diff --check` sem erros.
- `scripts/validate-repository.sh` executado com sucesso.

## Limites

- Não existe aplicação executável para auditoria.
- Nenhuma declaração de conformidade WCAG é emitida nesta sprint.
- Técnicas e combinações de tecnologias assistivas serão atualizadas durante a
  implementação.
- A conclusão depende de CI verde, aprovação e merge do Pull Request.

## Fontes oficiais

- <https://www.w3.org/TR/WCAG22/>
- <https://www.w3.org/WAI/standards-guidelines/wcag/>
- <https://www.w3.org/WAI/WCAG22/Understanding/>

## Resultado

A Sprint 007 está pronta para Pull Request.

# Plano dos gates finais — Módulo 1

## Versões congeladas

| Escopo | Commit |
| --- | --- |
| Oito aulas, quizzes e rubrica | `abd8b90` |
| Parecer pedagógico corrigido | `ba6dde9` |
| Controles editoriais, jurídicos e de acessibilidade | `c95e252` |

Os arquivos de aula, quizzes e rubrica não receberam alteração material entre
`abd8b90` e `c95e252`. Os commits posteriores registram pareceres, decisões de
uso bíblico por referências e controles de governança. Qualquer alteração
material futura exige nova identificação de versão e nova análise dos pareceres
afetados.

## Ordem obrigatória

1. completar bibliografias acadêmicas e confessionais verificáveis;
2. obter revisão histórica e textual especializada da Aula 3;
3. executar e registrar verificação humana de similaridade;
4. integrar o módulo na plataforma representativa;
5. testar acessibilidade com teclado, leitor de tela, zoom de 200%, largura de
   320 CSS px, movimento reduzido, pausa e retomada;
6. solicitar os pareceres finais aplicáveis;
7. executar o piloto pedagógico de 18 horas;
8. corrigir bloqueadores e repetir os gates afetados.

## Gates e responsáveis

| Gate | Evidência necessária | Estado |
| --- | --- | --- |
| Doutrinário, bíblico e pastoral | Confirmação de impacto das correções e dos controles | Pendente |
| Histórico e textual da Aula 3 | Fontes especializadas e parecer competente | Pendente |
| Pedagógico | Resultado do piloto e análise da carga horária | Pendente |
| Editorial e originalidade | Bibliografia, proveniência e relatório de similaridade | Pendente |
| Jurídico e direitos | Registro das fontes e de qualquer recurso futuro | Pendente |
| Acessibilidade | Implementação congelada e testes reais documentados | Pendente |

O autor não pode aprovar o próprio conteúdo. Relação institucional, qualificação
e possível conflito de interesse devem ser declarados. Um parecer não substitui
competência específica exigida por outro.

## Uso bíblico no piloto

O modo permanece `references_only`: são mostrados livro, capítulo e versículo,
sem reprodução de tradução. Texto integral, áudio, pesquisa, comparação,
ligação externa e pacote offline continuam bloqueados enquanto não houver
decisão técnica, jurídica e editorial própria.

## Como registrar um novo parecer

1. copie `final-review-template-v2.json`;
2. preencha o tipo de revisão, revisor, qualificação, relação e evidências;
3. informe os commits de conteúdo e controles exatamente como acima;
4. registre cada item como `compliant`, `needs-correction` ou `not-applicable`;
5. use decisão `approved`, `approved-with-conditions`,
   `changes-requested` ou `rejected`;
6. mantenha `automaticPublicationAuthorized` como `false`;
7. envie o JSON para verificação antes de incorporá-lo ao repositório.

## Bloqueio

Checks verdes comprovam apenas as verificações automatizadas existentes. Eles
não aprovam conteúdo, originalidade, licença, acessibilidade, carga horária ou
publicação. O PR nº 46 permanece em rascunho até que os gates aplicáveis tenham
evidência suficiente.

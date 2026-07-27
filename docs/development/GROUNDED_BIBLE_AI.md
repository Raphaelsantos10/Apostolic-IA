# IA bíblica fundamentada

O professor pesquisa primeiro em `ai_source_chunks` vinculados a fontes
explicitamente aprovadas. Sem resultados, recusa responder. Conversas, mensagens
e feedback pertencem ao titular por RLS, com limite inicial de 30 perguntas/dia.

A rota `/api/bible-teacher` é a única fronteira externa. A chave nunca chega ao
navegador. Sem `OPENAI_API_KEY`, o modo local continua funcional e fundamentado.
Quando configurada, usa a Responses API com `store: false`; o modelo pode ser
definido por `OPENAI_MODEL`.

Guardrails exigem citações, proíbem criação de doutrina e deixam claro que a IA
não substitui Bíblia, igreja, liderança pastoral ou ajuda profissional.

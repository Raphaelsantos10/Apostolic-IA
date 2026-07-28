import { NextResponse } from "next/server";
import { readJsonBody } from "../../../lib/request-security.mjs";
import { createClient } from "../../../lib/supabase/server";

function json(body: unknown, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Autenticação necessária." }, 401);

  const body = await readJsonBody(request, 16_384);
  if (!body.ok) {
    return json(
      { error: body.tooLarge ? "Pedido demasiado grande." : "JSON inválido." },
      body.tooLarge ? 413 : 400
    );
  }
  const input = body.value as Record<string, unknown>;
  const question = String(input.question ?? "").trim();
  if (question.length < 5 || question.length > 1000) {
    return json({ error: "Pergunta inválida." }, 400);
  }

  const { data: allowed, error: limitError } = await supabase.rpc(
    "consume_api_rate_limit",
    { p_bucket: "bible-teacher", p_limit: 10, p_window_seconds: 60 }
  );
  if (limitError) return json({ error: "Proteção temporariamente indisponível." }, 503);
  if (!allowed) return json({ error: "Muitas perguntas. Aguarde um minuto." }, 429);

  const { data: quota } = await supabase.rpc("ai_daily_quota_available");
  if (!quota) return json({ error: "Limite diário alcançado." }, 429);

  const { data: sources } = await supabase.rpc("search_approved_ai_sources", {
    p_query: question,
    p_limit: 5
  });
  if (!sources?.length) {
    return json({
      answer:
        "Não encontrei fundamento aprovado suficiente. Consulte a Bíblia e uma liderança responsável.",
      citations: []
    });
  }

  const citations = sources.map(
    (source: { title: string; reference_label: string }) => ({
      title: source.title,
      reference: source.reference_label
    })
  );
  let answer = `Com base nas fontes aprovadas: ${sources[0].content}`;

  if (process.env.OPENAI_API_KEY) {
    const context = sources
      .map(
        (source: { reference_label: string; content: string }) =>
          `[${source.reference_label}] ${source.content}`
      )
      .join("\n\n");
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
          store: false,
          instructions:
            "Auxilie estudo bíblico somente com o contexto aprovado. Cite referências. Não crie doutrina, não profetize e declare limites.",
          input: `CONTEXTO:\n${context}\n\nPERGUNTA:\n${question}`
        }),
        signal: AbortSignal.timeout(30_000)
      });
      if (response.ok) {
        const result = await response.json();
        answer = result.output_text || answer;
      }
    } catch {
      // Mantém a resposta local fundamentada sem expor detalhes ou conteúdo em logs.
    }
  }

  const { data: conversation } = await supabase
    .from("ai_conversations")
    .insert({ user_id: user.id, title: question.slice(0, 80) })
    .select("id")
    .single();
  if (conversation) {
    await supabase.from("ai_messages").insert([
      {
        conversation_id: conversation.id,
        user_id: user.id,
        role: "user",
        content: question
      },
      {
        conversation_id: conversation.id,
        user_id: user.id,
        role: "assistant",
        content: answer,
        citations
      }
    ]);
  }
  return json({ answer, citations });
}

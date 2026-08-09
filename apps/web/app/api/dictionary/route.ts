import { NextResponse } from "next/server";

function cleanDefinition(xml: string) {
  return xml
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request) {
  const word = new URL(request.url).searchParams.get("word")?.trim() ?? "";
  if (!/^[\p{L}-]{2,40}$/u.test(word)) {
    return NextResponse.json({ error: "Palavra inválida." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.dicionario-aberto.net/word/${encodeURIComponent(word.toLocaleLowerCase("pt"))}`,
      { signal: AbortSignal.timeout(8_000), next: { revalidate: 86_400 } }
    );
    if (!response.ok) return NextResponse.json({ word, definitions: [] });
    const entries = await response.json() as Array<{ xml?: string }>;
    const definitions = entries
      .map((entry) => cleanDefinition(entry.xml ?? ""))
      .filter(Boolean)
      .slice(0, 5);
    return NextResponse.json({ word, definitions });
  } catch {
    return NextResponse.json({ error: "Dicionário temporariamente indisponível." }, { status: 503 });
  }
}

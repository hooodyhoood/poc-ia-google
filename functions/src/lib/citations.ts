import type { Citation } from "./types";

/**
 * Extrait les sources de grounding renvoyées par Gemini (Vertex AI Search).
 * La forme exacte du `groundingMetadata` varie selon les versions du plugin,
 * on reste donc défensif et on ratisse large.
 */
export function extractCitations(response: unknown): Citation[] {
  const r = response as Record<string, any>;
  const gm =
    r?.custom?.groundingMetadata ??
    r?.raw?.candidates?.[0]?.groundingMetadata ??
    r?.message?.metadata?.groundingMetadata ??
    r?.candidates?.[0]?.groundingMetadata;

  const chunks: any[] = gm?.groundingChunks ?? gm?.grounding_chunks ?? [];

  const seen = new Set<string>();
  const citations: Citation[] = [];

  for (const chunk of chunks) {
    const ctx = chunk?.retrievedContext ?? chunk?.retrieved_context ?? chunk?.web;
    if (!ctx) continue;
    const uri: string = ctx.uri ?? "";
    const title: string = ctx.title ?? uri.split("/").pop() ?? "Source";
    const snippet: string = ctx.text ?? ctx.snippet ?? "";
    const key = uri || title + snippet.slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ title, uri, snippet });
  }

  return citations;
}

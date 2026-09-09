import { z } from "genkit";
import { ai, vertexAI } from "../genkit";
import { PROJECT_ID, SEARCH_LOCATION } from "../config";
import { loadAssistant } from "../lib/assistants";
import { loadHistory, ensureConversation, appendTurn } from "../lib/conversations";
import { extractCitations } from "../lib/citations";

const citationSchema = z.object({
  title: z.string(),
  uri: z.string(),
  snippet: z.string(),
});

export const chatInputSchema = z.object({
  assistantId: z.string().min(1),
  conversationId: z.string().optional(),
  message: z.string().min(1).max(8000),
});

export const chatOutputSchema = z.object({
  conversationId: z.string(),
  text: z.string(),
  citations: z.array(citationSchema),
});

export const chatFlow = ai.defineFlow(
  {
    name: "chat",
    inputSchema: chatInputSchema,
    outputSchema: chatOutputSchema,
    streamSchema: z.string(),
  },
  async (input, { context, sendChunk }) => {
    const uid: string | undefined = context?.auth?.uid;
    if (!uid) throw new Error("unauthenticated");

    const assistant = await loadAssistant(input.assistantId);
    if (!assistant) throw new Error("assistant-not-found");
    if (assistant.status !== "ready") throw new Error("assistant-not-ready");

    const history = await loadHistory(input.conversationId, uid);
    const grounded = Boolean(assistant.dataStoreId);

    const response = await ai.generate({
      model: vertexAI.model(assistant.model),
      system: assistant.systemPrompt,
      messages: history.map((turn) => ({
        role: turn.role,
        content: [{ text: turn.content }],
      })),
      prompt: input.message,
      config: grounded
        ? {
            vertexRetrieval: {
              datastore: {
                projectId: PROJECT_ID,
                location: SEARCH_LOCATION,
                dataStoreId: assistant.dataStoreId as string,
              },
            },
          }
        : {},
      onChunk: (chunk: { text: string }) => {
        if (chunk.text) sendChunk(chunk.text);
      },
    });

    const text = response.text;
    const citations = extractCitations(response);

    const conversationId = await ensureConversation({
      conversationId: input.conversationId,
      userId: uid,
      assistantId: input.assistantId,
      firstMessage: input.message,
    });

    await appendTurn({
      conversationId,
      userMessage: input.message,
      modelMessage: text,
      citations,
    });

    return { conversationId, text, citations };
  }
);

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "./firebaseAdmin";
import type { Citation, ChatRole, ConversationDoc } from "./types";

export interface HistoryTurn {
  role: ChatRole;
  content: string;
}

/**
 * Charge l'historique d'une conversation en vérifiant qu'elle appartient
 * bien à l'utilisateur courant. Renvoie une liste vide si aucune conversation
 * n'est encore associée (premier message).
 */
export async function loadHistory(
  conversationId: string | undefined,
  userId: string
): Promise<HistoryTurn[]> {
  if (!conversationId) return [];

  const convRef = db.collection("conversations").doc(conversationId);
  const conv = await convRef.get();
  if (!conv.exists) throw new Error("conversation-not-found");
  if ((conv.data() as ConversationDoc).userId !== userId) {
    throw new Error("conversation-forbidden");
  }

  const msgs = await convRef
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  return msgs.docs.map((d) => ({
    role: d.data().role as ChatRole,
    content: d.data().content as string,
  }));
}

/** Crée la conversation si besoin et renvoie son id. */
export async function ensureConversation(params: {
  conversationId?: string;
  userId: string;
  assistantId: string;
  firstMessage: string;
}): Promise<string> {
  if (params.conversationId) return params.conversationId;

  const ref = await db.collection("conversations").add({
    assistantId: params.assistantId,
    userId: params.userId,
    title: params.firstMessage.slice(0, 60) || "Nouvelle conversation",
    createdAt: FieldValue.serverTimestamp(),
    lastMessageAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/** Enregistre le message utilisateur puis la réponse du modèle. */
export async function appendTurn(params: {
  conversationId: string;
  userMessage: string;
  modelMessage: string;
  citations: Citation[];
}): Promise<void> {
  const convRef = db.collection("conversations").doc(params.conversationId);
  const messages = convRef.collection("messages");
  const now = Date.now();

  const batch = db.batch();
  batch.set(messages.doc(), {
    role: "user",
    content: params.userMessage,
    createdAt: Timestamp.fromMillis(now),
  });
  batch.set(messages.doc(), {
    role: "model",
    content: params.modelMessage,
    citations: params.citations,
    createdAt: Timestamp.fromMillis(now + 1),
  });
  batch.update(convRef, { lastMessageAt: Timestamp.fromMillis(now + 1) });
  await batch.commit();
}

import { db } from "./firebaseAdmin";
import type { AssistantDoc } from "./types";

export interface Assistant extends AssistantDoc {
  id: string;
}

export async function loadAssistant(id: string): Promise<Assistant | null> {
  const snap = await db.collection("assistants").doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as AssistantDoc) };
}

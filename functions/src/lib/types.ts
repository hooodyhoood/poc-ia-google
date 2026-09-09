import type { Timestamp } from "firebase-admin/firestore";

export type AssistantStatus = "provisioning" | "ready" | "error";
export type DocumentStatus = "indexing" | "indexed" | "error";
export type ChatRole = "user" | "model";

export interface AssistantDoc {
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  dataStoreId: string | null;
  status: AssistantStatus;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Citation {
  title: string;
  uri: string;
  snippet: string;
}

export interface MessageDoc {
  role: ChatRole;
  content: string;
  citations?: Citation[];
  createdAt: Timestamp;
}

export interface ConversationDoc {
  assistantId: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
}

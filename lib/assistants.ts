"use client";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  ref as storageRef,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { db, functions, storage } from "@/lib/firebase";

/* --------------------------------- Types ---------------------------------- */

export type AssistantStatus = "provisioning" | "ready" | "error";
export type DocumentStatus = "indexing" | "indexed" | "error";

export interface Assistant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  status: AssistantStatus;
  dataStoreId: string | null;
}

export interface KnowledgeDocument {
  id: string;
  filename: string;
  contentType: string | null;
  size: number;
  status: DocumentStatus;
}

export interface Citation {
  title: string;
  uri: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  citations?: Citation[];
}

export interface Conversation {
  id: string;
  assistantId: string;
  title: string;
}

/* ------------------------------ Firestore -------------------------------- */

export function watchAssistants(cb: (list: Assistant[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "assistants"), orderBy("createdAt", "desc")),
    (snap) => {
      cb(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Assistant, "id">) }))
      );
    }
  );
}

export function watchAssistant(
  id: string,
  cb: (assistant: Assistant | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "assistants", id), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Assistant, "id">) } : null);
  });
}

export function watchDocuments(
  assistantId: string,
  cb: (docs: KnowledgeDocument[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, "assistants", assistantId, "documents"),
      orderBy("createdAt", "desc")
    ),
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<KnowledgeDocument, "id">),
        }))
      );
    }
  );
}

export function watchConversations(
  userId: string,
  cb: (list: Conversation[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, "conversations"),
      where("userId", "==", userId),
      orderBy("lastMessageAt", "desc")
    ),
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          assistantId: d.data().assistantId,
          title: d.data().title,
        }))
      );
    }
  );
}

export function watchMessages(
  conversationId: string,
  cb: (messages: ChatMessage[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    ),
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          role: d.data().role,
          content: d.data().content,
          citations: d.data().citations ?? [],
        }))
      );
    }
  );
}

/* ---------------------------- Callable (chat) ---------------------------- */

interface ChatInput {
  assistantId: string;
  conversationId?: string;
  message: string;
}
interface ChatOutput {
  conversationId: string;
  text: string;
  citations: Citation[];
}

/**
 * Envoie un message et streame la réponse. `onChunk` reçoit les fragments de
 * texte au fil de l'eau ; la promesse résout avec la réponse complète.
 */
export async function sendChat(
  input: ChatInput,
  onChunk: (delta: string) => void
): Promise<ChatOutput> {
  const callable = httpsCallable<ChatInput, ChatOutput, string>(functions, "chat");
  const { stream, data } = await callable.stream(input);
  for await (const chunk of stream) {
    if (typeof chunk === "string") onChunk(chunk);
  }
  return data;
}

/* ---------------------------- Callable (admin) -------------------------- */

export interface AssistantInput {
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
}

export const createAssistant = httpsCallable<
  AssistantInput,
  { id: string; status: string }
>(functions, "createAssistant");

export const updateAssistant = httpsCallable<
  AssistantInput & { id: string },
  { ok: true }
>(functions, "updateAssistant");

export const deleteAssistant = httpsCallable<{ id: string }, { ok: true }>(
  functions,
  "deleteAssistant"
);

/* ------------------------- Storage (documents) ------------------------- */

/**
 * Upload d'un document vers `assistants/{assistantId}/{docId}/{filename}`.
 * Le trigger `ingestDocument` prend le relais pour l'indexation.
 */
export function uploadDocument(
  assistantId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> {
  const docId = crypto.randomUUID();
  const path = `assistants/${assistantId}/${docId}/${file.name}`;
  const task = uploadBytesResumable(storageRef(storage, path), file, {
    contentType: file.type || "application/octet-stream",
  });

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap: UploadTaskSnapshot) => {
        if (onProgress) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      reject,
      () => resolve()
    );
  });
}

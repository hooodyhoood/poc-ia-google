"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Quote } from "lucide-react";
import {
  sendChat,
  watchAssistant,
  watchMessages,
  type Assistant,
  type ChatMessage,
  type Citation,
} from "@/lib/assistants";

export default function ChatWindow({
  assistantId,
  conversationId: initialConversationId,
}: {
  assistantId: string;
  conversationId?: string;
}) {
  const router = useRouter();
  const [assistant, setAssistant] = useState<Assistant | null | undefined>(undefined);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<{ user: string; model: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => watchAssistant(assistantId, setAssistant), [assistantId]);

  useEffect(() => {
    setConversationId(initialConversationId);
  }, [initialConversationId]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    return watchMessages(conversationId, setMessages);
  }, [conversationId]);

  // Retire le message optimiste une fois qu'il est persisté dans Firestore.
  useEffect(() => {
    if (!pending) return;
    const hasUser = messages.some(
      (m) => m.role === "user" && m.content === pending.user
    );
    const hasModel = messages.some((m) => m.role === "model");
    if (hasUser && hasModel) setPending(null);
  }, [messages, pending]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const message = draft.trim();
    if (!message || pending) return;
    setDraft("");
    setError(null);
    setPending({ user: message, model: "" });

    try {
      const res = await sendChat(
        { assistantId, conversationId, message },
        (delta) =>
          setPending((p) => (p ? { ...p, model: p.model + delta } : p))
      );
      if (!conversationId) {
        setConversationId(res.conversationId);
        router.replace(
          `/dashboard/chat?a=${assistantId}&c=${res.conversationId}`
        );
      }
    } catch (err) {
      setPending(null);
      setError(
        err instanceof Error ? friendlyError(err.message) : "Erreur lors de l'envoi."
      );
    }
  }

  if (assistant === undefined) {
    return <p className="font-sans text-sm text-muted">Chargement…</p>;
  }
  if (assistant === null) {
    return (
      <p className="font-sans text-sm text-ink">Cet assistant n'existe plus.</p>
    );
  }

  const notReady = assistant.status !== "ready";
  const empty = messages.length === 0 && !pending;

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <header className="border-b border-line pb-4">
        <h1 className="font-display text-2xl font-medium text-ink">
          {assistant.name}
        </h1>
        {assistant.description && (
          <p className="mt-1 font-sans text-[13px] text-muted">
            {assistant.description}
          </p>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto py-6">
        {empty && (
          <p className="font-sans text-sm text-muted">
            Pose ta première question à {assistant.name}.
          </p>
        )}

        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} citations={m.citations} />
        ))}

        {pending && (
          <>
            <Bubble role="user" content={pending.user} />
            <Bubble
              role="model"
              content={pending.model || "…"}
              streaming={!pending.model}
            />
          </>
        )}
      </div>

      {error && (
        <p className="mb-2 rounded-md bg-red-50 px-3 py-2 font-sans text-[13px] text-red-700">
          {error}
        </p>
      )}
      {notReady && (
        <p className="mb-2 rounded-md bg-amber-light px-3 py-2 font-sans text-[13px] text-amber">
          Cet assistant n'est pas encore prêt.
        </p>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-line pt-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          rows={1}
          disabled={notReady}
          placeholder="Écris ton message…"
          className="max-h-40 flex-1 resize-none rounded-md border border-line bg-surface px-3 py-2 font-sans text-sm text-ink outline-none focus:border-teal disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={notReady || !draft.trim() || !!pending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal text-white transition hover:bg-teal-dark disabled:opacity-40"
          aria-label="Envoyer"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}

function Bubble({
  role,
  content,
  citations,
  streaming,
}: {
  role: "user" | "model";
  content: string;
  citations?: Citation[];
  streaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={`max-w-[80%] ${isUser ? "" : "w-full"}`}>
        <div
          className={`whitespace-pre-wrap rounded-lg px-4 py-3 font-sans text-sm leading-relaxed ${
            isUser
              ? "bg-teal text-white"
              : "border border-line bg-surface text-ink"
          } ${streaming ? "animate-pulse" : ""}`}
        >
          {content}
        </div>
        {citations && citations.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {citations.map((c, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-md border border-line bg-paper px-3 py-2"
              >
                <Quote size={13} className="mt-0.5 shrink-0 text-teal" />
                <div className="min-w-0">
                  {/^https?:\/\//.test(c.uri) ? (
                    <a
                      href={c.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="font-sans text-[12px] font-medium text-teal-dark underline"
                    >
                      {c.title}
                    </a>
                  ) : (
                    <span className="font-sans text-[12px] font-medium text-ink">
                      {c.title}
                    </span>
                  )}
                  {c.snippet && (
                    <p className="mt-0.5 line-clamp-2 font-sans text-[11px] text-muted">
                      {c.snippet}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function friendlyError(code: string): string {
  if (code.includes("assistant-not-ready")) return "L'assistant n'est pas encore prêt.";
  if (code.includes("unauthenticated")) return "Session expirée, reconnecte-toi.";
  if (code.includes("permission-denied")) return "Accès refusé.";
  return "Une erreur est survenue. Réessaie.";
}

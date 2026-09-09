"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ChatWindow from "@/components/ChatWindow";

function ChatPageInner() {
  const params = useSearchParams();
  const assistantId = params.get("a");
  const conversationId = params.get("c") ?? undefined;

  if (!assistantId) {
    return (
      <div>
        <p className="font-sans text-sm text-ink">Aucun assistant sélectionné.</p>
        <Link
          href="/dashboard/assistants"
          className="mt-2 inline-flex items-center gap-1 font-sans text-sm text-teal"
        >
          <ArrowLeft size={14} /> Voir les assistants
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/assistants"
        className="inline-flex items-center gap-1 font-sans text-[13px] text-muted hover:text-ink"
      >
        <ArrowLeft size={14} /> Assistants
      </Link>
      <div className="mt-3">
        <ChatWindow
          key={`${assistantId}:${conversationId ?? "new"}`}
          assistantId={assistantId}
          conversationId={conversationId}
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="font-sans text-sm text-muted">Chargement…</p>}>
      <ChatPageInner />
    </Suspense>
  );
}

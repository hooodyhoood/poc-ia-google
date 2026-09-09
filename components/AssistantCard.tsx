"use client";

import Link from "next/link";
import { Bot, ArrowRight } from "lucide-react";
import type { Assistant } from "@/lib/assistants";

export default function AssistantCard({ assistant }: { assistant: Assistant }) {
  const ready = assistant.status === "ready";

  return (
    <Link
      href={ready ? `/dashboard/chat?a=${assistant.id}` : "#"}
      aria-disabled={!ready}
      className={`group flex flex-col rounded-lg border border-line bg-surface p-6 transition ${
        ready ? "hover:border-teal" : "pointer-events-none opacity-60"
      }`}
    >
      <Bot size={20} strokeWidth={1.75} className="text-teal" />
      <h2 className="mt-4 font-sans text-sm font-semibold text-ink">
        {assistant.name}
      </h2>
      <p className="mt-2 line-clamp-3 flex-1 font-sans text-[13px] leading-relaxed text-muted">
        {assistant.description || "Aucune description."}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <StatusPill status={assistant.status} />
        {ready && (
          <ArrowRight
            size={16}
            className="text-muted transition group-hover:translate-x-0.5 group-hover:text-teal"
          />
        )}
      </div>
    </Link>
  );
}

export function StatusPill({ status }: { status: Assistant["status"] }) {
  const map = {
    provisioning: { label: "En préparation…", cls: "bg-amber-light text-amber" },
    ready: { label: "Prêt", cls: "bg-teal-light text-teal-dark" },
    error: { label: "Erreur", cls: "bg-red-100 text-red-700" },
  } as const;
  const { label, cls } = map[status];
  return (
    <span className={`rounded-sm px-1.5 py-0.5 font-sans text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

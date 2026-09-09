"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { watchAssistants, type Assistant } from "@/lib/assistants";
import AssistantCard from "@/components/AssistantCard";

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[] | null>(null);

  useEffect(() => watchAssistants(setAssistants), []);

  return (
    <div>
      <header>
        <p className="font-sans text-sm text-muted">Assistants</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">
          Choisis un assistant
        </h1>
        <p className="mt-2 max-w-lg font-sans text-sm leading-relaxed text-muted">
          Chaque assistant répond à partir de sa propre base de connaissance.
        </p>
      </header>

      {assistants === null ? (
        <p className="mt-10 font-sans text-sm text-muted">Chargement…</p>
      ) : assistants.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-lg border border-dashed border-line bg-surface px-6 py-16 text-center">
          <Bot size={24} strokeWidth={1.5} className="text-muted" />
          <p className="mt-3 font-sans text-sm text-ink">Aucun assistant pour l'instant.</p>
          <p className="mt-1 font-sans text-[13px] text-muted">
            Un administrateur peut en créer depuis la section Admin.
          </p>
        </div>
      ) : (
        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assistants.map((a) => (
            <AssistantCard key={a.id} assistant={a} />
          ))}
        </section>
      )}
    </div>
  );
}

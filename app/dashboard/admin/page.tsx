"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  watchAssistants,
  deleteAssistant,
  type Assistant,
} from "@/lib/assistants";
import { StatusPill } from "@/components/AssistantCard";
import AssistantForm from "@/components/admin/AssistantForm";
import DocumentUploader from "@/components/admin/DocumentUploader";

export default function AdminPage() {
  const { loading, isAdmin } = useAuth();
  const router = useRouter();
  const [assistants, setAssistants] = useState<Assistant[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/dashboard");
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) return watchAssistants(setAssistants);
  }, [isAdmin]);

  async function handleDelete(a: Assistant) {
    if (!confirm(`Supprimer « ${a.name} » et sa base de connaissance ?`)) return;
    try {
      await deleteAssistant({ id: a.id });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Suppression impossible.");
    }
  }

  if (loading || !isAdmin) {
    return <p className="font-sans text-sm text-muted">Chargement…</p>;
  }

  return (
    <div>
      <header className="flex items-start justify-between">
        <div>
          <p className="font-sans text-sm text-muted">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-medium text-ink">
            Assistants
          </h1>
        </div>
        {!creating && (
          <button
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 font-sans text-sm font-medium text-white hover:bg-teal-dark"
          >
            <Plus size={16} /> Nouvel assistant
          </button>
        )}
      </header>

      {creating && (
        <div className="mt-6">
          <AssistantForm
            onDone={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {assistants === null && (
          <p className="font-sans text-sm text-muted">Chargement…</p>
        )}
        {assistants?.length === 0 && !creating && (
          <p className="font-sans text-sm text-muted">
            Aucun assistant. Crée le premier.
          </p>
        )}

        {assistants?.map((a) =>
          editing === a.id ? (
            <AssistantForm
              key={a.id}
              existing={a}
              onDone={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div
              key={a.id}
              className="rounded-lg border border-line bg-surface"
            >
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <ChevronDown
                    size={16}
                    className={`text-muted transition ${
                      expanded === a.id ? "rotate-180" : ""
                    }`}
                  />
                  <span className="font-sans text-sm font-semibold text-ink">
                    {a.name}
                  </span>
                  <StatusPill status={a.status} />
                </button>
                <button
                  onClick={() => {
                    setEditing(a.id);
                    setCreating(false);
                  }}
                  className="rounded-md p-1.5 text-muted hover:bg-paper hover:text-ink"
                  aria-label="Modifier"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(a)}
                  className="rounded-md p-1.5 text-muted hover:bg-paper hover:text-red-700"
                  aria-label="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {expanded === a.id && (
                <div className="space-y-4 border-t border-line p-4">
                  <p className="whitespace-pre-wrap font-sans text-[13px] text-muted">
                    {a.systemPrompt}
                  </p>
                  {a.status === "ready" ? (
                    <DocumentUploader assistantId={a.id} />
                  ) : (
                    <p className="font-sans text-[13px] text-amber">
                      Base de connaissance indisponible ({a.status}).
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

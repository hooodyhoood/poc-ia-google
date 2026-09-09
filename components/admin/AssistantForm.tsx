"use client";

import { useState } from "react";
import {
  createAssistant,
  updateAssistant,
  type Assistant,
} from "@/lib/assistants";

export default function AssistantForm({
  existing,
  onDone,
  onCancel,
}: {
  existing?: Assistant;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(existing?.systemPrompt ?? "");
  const [model, setModel] = useState(existing?.model ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        systemPrompt: systemPrompt.trim(),
        model: model.trim() || undefined,
      };
      if (existing) {
        await updateAssistant({ id: existing.id, ...payload });
      } else {
        await createAssistant(payload);
      }
      onDone();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer l'assistant."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-line bg-surface p-6"
    >
      <h3 className="font-sans text-sm font-semibold text-ink">
        {existing ? "Modifier l'assistant" : "Nouvel assistant"}
      </h3>

      <Field label="Nom">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputCls}
          placeholder="ex. Assistant RH"
        />
      </Field>

      <Field label="Description" hint="Affichée sur la carte de sélection.">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
          placeholder="ex. Répond aux questions sur les congés, la paie…"
        />
      </Field>

      <Field
        label="Prompt système"
        hint="Le rôle, le ton et les règles de l'assistant."
      >
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          required
          rows={5}
          className={`${inputCls} resize-y`}
          placeholder="Tu es un assistant RH. Réponds uniquement à partir des documents fournis…"
        />
      </Field>

      <Field label="Modèle" hint="Laisser vide pour le modèle par défaut.">
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className={inputCls}
          placeholder="gemini-flash-latest"
        />
      </Field>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 font-sans text-[13px] text-red-700">
          {error}
        </p>
      )}
      {!existing && (
        <p className="font-sans text-[12px] text-muted">
          La création d'une base de connaissance Vertex AI Search peut prendre
          quelques minutes.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-teal px-4 py-2 font-sans text-sm font-medium text-white hover:bg-teal-dark disabled:opacity-50"
        >
          {busy ? "Enregistrement…" : existing ? "Enregistrer" : "Créer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 font-sans text-sm text-muted hover:text-ink"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 font-sans text-sm text-ink outline-none focus:border-teal";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-sans text-[13px] font-medium text-ink">{label}</span>
      {hint && <span className="ml-2 font-sans text-[12px] text-muted">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

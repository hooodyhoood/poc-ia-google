"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  uploadDocument,
  watchDocuments,
  type KnowledgeDocument,
} from "@/lib/assistants";

const ACCEPT = ".pdf,.txt,.md,.html,.htm,.docx,.pptx";
const MAX_BYTES = 20 * 1024 * 1024;

export default function DocumentUploader({ assistantId }: { assistantId: string }) {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => watchDocuments(assistantId, setDocs), [assistantId]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        setError(`${file.name} dépasse 20 Mo.`);
        continue;
      }
      try {
        setProgress(0);
        await uploadDocument(assistantId, file, setProgress);
      } catch {
        setError(`Échec de l'upload de ${file.name}.`);
      } finally {
        setProgress(null);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 font-sans text-[13px] font-medium text-ink hover:border-teal disabled:opacity-50"
        >
          <Upload size={14} />
          {progress !== null ? `Envoi… ${progress}%` : "Ajouter des documents"}
        </button>
        <span className="font-sans text-[12px] text-muted">
          PDF, TXT, MD, HTML, DOCX, PPTX — 20 Mo max
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="font-sans text-[12px] text-red-700">{error}</p>
      )}

      {docs.length > 0 && (
        <ul className="divide-y divide-line rounded-md border border-line">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-3 py-2">
              <FileText size={14} className="shrink-0 text-muted" />
              <span className="flex-1 truncate font-sans text-[13px] text-ink">
                {d.filename}
              </span>
              <DocStatus status={d.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DocStatus({ status }: { status: KnowledgeDocument["status"] }) {
  if (status === "indexed") {
    return (
      <span className="inline-flex items-center gap-1 font-sans text-[12px] text-teal-dark">
        <CheckCircle2 size={13} /> Indexé
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 font-sans text-[12px] text-red-700">
        <AlertCircle size={13} /> Erreur
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-sans text-[12px] text-muted">
      <Loader2 size={13} className="animate-spin" /> Indexation…
    </span>
  );
}

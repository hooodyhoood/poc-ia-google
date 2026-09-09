import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onCallGenkit, hasClaim } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";

import { FUNCTIONS_REGION, STORAGE_REGION, DEFAULT_MODEL } from "./config";
import { db, storage } from "./lib/firebaseAdmin";
import { chatFlow } from "./flows/chat";
import {
  createDataStore,
  deleteDataStore,
  importGcsDocument,
} from "./lib/discoveryengine";

setGlobalOptions({ region: FUNCTIONS_REGION, maxInstances: 10 });

/* -------------------------------------------------------------------------- */
/*  Chat (Genkit)                                                             */
/* -------------------------------------------------------------------------- */

export const chat = onCallGenkit(
  {
    authPolicy: hasClaim("email_verified"),
    // enforceAppCheck: true, // activé à l'étape "finitions" une fois reCAPTCHA en place
  },
  chatFlow
);

/* -------------------------------------------------------------------------- */
/*  Admin — gestion des assistants                                            */
/* -------------------------------------------------------------------------- */

function assertAdmin(req: CallableRequest): string {
  if (!req.auth) throw new HttpsError("unauthenticated", "Connexion requise.");
  if (req.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Réservé aux administrateurs.");
  }
  return req.auth.uid;
}

interface CreateAssistantData {
  name?: string;
  description?: string;
  systemPrompt?: string;
  model?: string;
}

export const createAssistant = onCall(
  { timeoutSeconds: 540, memory: "512MiB" },
  async (req) => {
    const uid = assertAdmin(req);
    const data = (req.data ?? {}) as CreateAssistantData;

    const name = (data.name ?? "").trim();
    const systemPrompt = (data.systemPrompt ?? "").trim();
    if (!name) throw new HttpsError("invalid-argument", "Le nom est obligatoire.");
    if (!systemPrompt) {
      throw new HttpsError("invalid-argument", "Le prompt système est obligatoire.");
    }

    const ref = db.collection("assistants").doc();
    await ref.set({
      name,
      description: (data.description ?? "").trim(),
      systemPrompt,
      model: (data.model ?? "").trim() || DEFAULT_MODEL,
      dataStoreId: null,
      status: "provisioning",
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    try {
      const dataStoreId = await createDataStore(ref.id);
      await ref.update({
        dataStoreId,
        status: "ready",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { id: ref.id, status: "ready" };
    } catch (err) {
      logger.error("createDataStore failed", err);
      await ref.update({
        status: "error",
        updatedAt: FieldValue.serverTimestamp(),
      });
      throw new HttpsError(
        "internal",
        "La création de la base de connaissance a échoué."
      );
    }
  }
);

export const updateAssistant = onCall(async (req) => {
  assertAdmin(req);
  const { id, name, description, systemPrompt, model } = (req.data ?? {}) as {
    id?: string;
  } & CreateAssistantData;
  if (!id) throw new HttpsError("invalid-argument", "id manquant.");

  const ref = db.collection("assistants").doc(id);
  if (!(await ref.get()).exists) {
    throw new HttpsError("not-found", "Assistant introuvable.");
  }

  const patch: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (typeof name === "string" && name.trim()) patch.name = name.trim();
  if (typeof description === "string") patch.description = description.trim();
  if (typeof systemPrompt === "string" && systemPrompt.trim()) {
    patch.systemPrompt = systemPrompt.trim();
  }
  if (typeof model === "string" && model.trim()) patch.model = model.trim();

  await ref.update(patch);
  return { ok: true };
});

export const deleteAssistant = onCall(
  { timeoutSeconds: 300 },
  async (req) => {
    assertAdmin(req);
    const { id } = (req.data ?? {}) as { id?: string };
    if (!id) throw new HttpsError("invalid-argument", "id manquant.");

    const ref = db.collection("assistants").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Assistant introuvable.");
    const dataStoreId = snap.data()?.dataStoreId as string | null;

    // Documents Firestore
    const docs = await ref.collection("documents").get();
    await Promise.all(docs.docs.map((d) => d.ref.delete()));

    // Fichiers Cloud Storage
    await storage
      .bucket()
      .deleteFiles({ prefix: `assistants/${id}/` })
      .catch((e) => logger.warn("storage cleanup failed", e));

    // Data store Vertex AI Search
    if (dataStoreId) {
      await deleteDataStore(dataStoreId).catch((e) =>
        logger.warn("deleteDataStore failed", e)
      );
    }

    await ref.delete();
    return { ok: true };
  }
);

/* -------------------------------------------------------------------------- */
/*  Ingestion des documents (trigger Cloud Storage)                           */
/* -------------------------------------------------------------------------- */

export const ingestDocument = onObjectFinalized(
  { region: STORAGE_REGION, timeoutSeconds: 540, memory: "512MiB" },
  async (event) => {
    const filePath = event.data.name;
    // Convention : assistants/{assistantId}/{docId}/{filename}
    if (!filePath || !filePath.startsWith("assistants/")) return;

    const parts = filePath.split("/");
    if (parts.length < 4) return;
    const [, assistantId, docId] = parts;
    const filename = parts.slice(3).join("/");

    const assistantRef = db.collection("assistants").doc(assistantId);
    const assistantSnap = await assistantRef.get();
    if (!assistantSnap.exists) {
      logger.warn("ingestDocument: assistant introuvable", { assistantId });
      return;
    }
    const dataStoreId = assistantSnap.data()?.dataStoreId as string | null;
    const docRef = assistantRef.collection("documents").doc(docId);

    await docRef.set(
      {
        filename,
        contentType: event.data.contentType ?? null,
        size: Number(event.data.size ?? 0),
        storagePath: filePath,
        status: "indexing",
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    try {
      if (!dataStoreId) throw new Error("assistant sans data store");
      const gcsUri = `gs://${event.data.bucket}/${filePath}`;
      const operation = await importGcsDocument(dataStoreId, gcsUri);
      await operation.promise();
      await docRef.update({ status: "indexed" });
      logger.info("Document indexé", { assistantId, docId });
    } catch (err) {
      logger.error("ingestDocument failed", err);
      await docRef.update({ status: "error" });
    }
  }
);

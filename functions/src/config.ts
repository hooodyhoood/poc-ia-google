/**
 * Configuration centrale des functions.
 *
 * Toutes les valeurs sensibles viennent de l'environnement d'exécution :
 * - GCLOUD_PROJECT est injecté automatiquement par Cloud Functions.
 * - Les autres peuvent être surchargées via `functions/.env` (voir .env.example).
 */

export const PROJECT_ID =
  process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "";

/** Région où appeler les modèles Gemini via Vertex AI. */
export const VERTEX_LOCATION = process.env.VERTEX_LOCATION || "us-central1";

/**
 * Emplacement des data stores Vertex AI Search (Discovery Engine).
 * Le plus courant est "global" ; "eu" ou "us" pour rester sur un continent.
 */
export const SEARCH_LOCATION = process.env.SEARCH_LOCATION || "global";

/** Région de déploiement des functions (doit héberger Vertex AI + Eventarc). */
export const FUNCTIONS_REGION = process.env.FUNCTIONS_REGION || "europe-west1";

/**
 * Région du bucket Cloud Storage par défaut, pour le trigger d'ingestion.
 * Si `firebase deploy` se plaint d'un mismatch de région sur `ingestDocument`,
 * renseigner ici l'emplacement réel du bucket (ex. "us-central1").
 */
export const STORAGE_REGION = process.env.STORAGE_REGION || FUNCTIONS_REGION;

/** Modèle Gemini par défaut pour un nouvel assistant. */
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "gemini-flash-latest";

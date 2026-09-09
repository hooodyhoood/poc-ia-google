import { genkit } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";
import { VERTEX_LOCATION } from "./config";

/**
 * Instance Genkit partagée. Le plugin Vertex AI utilise les identifiants
 * par défaut de l'environnement (ADC) — aucune clé API à gérer.
 */
export const ai = genkit({
  plugins: [vertexAI({ location: VERTEX_LOCATION })],
});

export { vertexAI };

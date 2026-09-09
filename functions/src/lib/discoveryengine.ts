import {
  DataStoreServiceClient,
  DocumentServiceClient,
  protos,
} from "@google-cloud/discoveryengine";
import { PROJECT_ID, SEARCH_LOCATION } from "../config";
import * as logger from "firebase-functions/logger";

type ICreateDataStoreRequest =
  protos.google.cloud.discoveryengine.v1.ICreateDataStoreRequest;
type IImportDocumentsRequest =
  protos.google.cloud.discoveryengine.v1.IImportDocumentsRequest;

const SolutionType = protos.google.cloud.discoveryengine.v1.SolutionType;

/**
 * Vertex AI Search (Discovery Engine) — un data store par assistant.
 *
 * Les data stores hors "global" exigent un endpoint régional explicite.
 */
const apiEndpoint =
  SEARCH_LOCATION === "global"
    ? undefined
    : `${SEARCH_LOCATION}-discoveryengine.googleapis.com`;

const clientOptions = apiEndpoint ? { apiEndpoint } : undefined;
const dataStoreClient = new DataStoreServiceClient(clientOptions);
const documentClient = new DocumentServiceClient(clientOptions);

const collectionPath = () =>
  `projects/${PROJECT_ID}/locations/${SEARCH_LOCATION}/collections/default_collection`;

const dataStorePath = (dataStoreId: string) =>
  `${collectionPath()}/dataStores/${dataStoreId}`;

const branchPath = (dataStoreId: string) =>
  `${dataStorePath(dataStoreId)}/branches/default_branch`;

/** Identifiant de data store dérivé de l'id d'assistant (contraintes DE : [a-z0-9-], <=63). */
function dataStoreIdFor(assistantId: string): string {
  return `assistant-${assistantId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 63);
}

/** Crée un data store de documents non structurés pour un assistant. */
export async function createDataStore(assistantId: string): Promise<string> {
  const dataStoreId = dataStoreIdFor(assistantId);
  logger.info("Creating data store", { dataStoreId });

  const request: ICreateDataStoreRequest = {
    parent: collectionPath(),
    dataStoreId,
    dataStore: {
      displayName: `Assistant ${assistantId}`,
      industryVertical: "GENERIC",
      solutionTypes: [SolutionType.SOLUTION_TYPE_SEARCH],
      contentConfig: "CONTENT_REQUIRED",
    },
  };

  const [operation] = await dataStoreClient.createDataStore(request);
  await operation.promise();

  logger.info("Data store ready", { dataStoreId });
  return dataStoreId;
}

/** Supprime le data store d'un assistant (best effort). */
export async function deleteDataStore(dataStoreId: string): Promise<void> {
  const [operation] = await dataStoreClient.deleteDataStore({
    name: dataStorePath(dataStoreId),
  });
  await operation.promise();
}

/**
 * Importe un document depuis Cloud Storage dans le data store.
 * Renvoie l'opération longue — au choix de l'appelant de l'attendre.
 */
export async function importGcsDocument(dataStoreId: string, gcsUri: string) {
  const request: IImportDocumentsRequest = {
    parent: branchPath(dataStoreId),
    gcsSource: {
      inputUris: [gcsUri],
      dataSchema: "content",
    },
    reconciliationMode: "INCREMENTAL",
  };

  const [operation] = await documentClient.importDocuments(request);
  return operation;
}

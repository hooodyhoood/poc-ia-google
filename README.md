# Atelier — POC IA (auth + assistants IA à bases de connaissance)

Le POC couvre :

- **Authentification Google** via Firebase + shell de dashboard.
- **Assistants IA** : plusieurs assistants, chacun avec son prompt système et sa
  **base de connaissance dédiée** (Vertex AI Search). Le chat utilise **Gemini
  via Vertex AI**, ancré sur les documents de l'assistant, avec citations.
- **UI d'admin** pour créer/éditer les assistants et téléverser leurs documents.

Les modules **Rendez-vous** et **Articles** restent des placeholders.

## Stack

- Next.js 14 (App Router, export statique) + TypeScript + Tailwind CSS
- Firebase Authentication (Google Sign-In) + Firestore
- Firebase Hosting (front) + **Cloud Functions for Firebase + Genkit** (backend IA)
- Vertex AI (Gemini) + Vertex AI Search / Discovery Engine (RAG)

> ⚠️ Le backend IA impose le **plan Blaze** (facturation à l'usage).

## 1. Créer le projet Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → **Ajouter un projet**.
2. **Authentication** → **Sign-in method** → active **Google**.
3. **Firestore Database** → **Créer une base de données** → mode production.
4. **Storage** → **Commencer** (bucket par défaut).
5. **Paramètres du projet** → **Général** → **Vos applications** → icône Web (`</>`).
   Copie les valeurs de configuration.
6. **Upgrade vers le plan Blaze** (roue crantée → Utilisation et facturation).

## 2. Activer les APIs Google Cloud

Dans [console.cloud.google.com](https://console.cloud.google.com) (même projet) → **APIs & Services** → activer :

- Vertex AI API
- Discovery Engine API (*AI Applications / Vertex AI Search*)
- Cloud Functions, Cloud Build, Artifact Registry, Eventarc, Cloud Run

Puis, dans **IAM**, sur le compte de service par défaut des functions
(`<project-number>-compute@developer.gserviceaccount.com` ou
`<project>@appspot.gserviceaccount.com`), ajouter les rôles :

- **Vertex AI User**
- **Discovery Engine Editor**
- **Storage Object Admin**

## 3. Configurer le projet local

```bash
cp .env.local.example .env.local          # front : valeurs Firebase + région functions
cp functions/.env.example functions/.env  # backend : optionnel (surcharges)
npm install
npm --prefix functions install
```

## 4. Déployer les règles & le backend

```bash
npm install -g firebase-tools
firebase login
firebase use spak-174b7   # ou le projet créé plus haut

firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```

Le premier déploiement des functions peut demander l'activation d'APIs — accepter.

> Si le déploiement de `ingestDocument` échoue sur un mismatch de région,
> renseigner l'emplacement réel du bucket dans `functions/.env`
> (`STORAGE_REGION=...`) et redéployer.

## 5. Se donner le rôle admin

Le rôle admin est un *custom claim*. Après une première connexion à l'app :

```bash
# Générer une clé : Console Firebase > Paramètres > Comptes de service > Générer une clé privée
# La placer en service-account.json à la racine (gitignoré), puis :
cd functions && node scripts/set-admin.mjs ton.email@example.com
```

Se déconnecter/reconnecter dans l'app pour rafraîchir le jeton → la section
**Admin** apparaît dans la sidebar.

## 6. Lancer en local

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) → `/login` → connexion Google → `/dashboard`.

Le front en dev appelle les **functions déployées** (pas d'émulateur configuré).
Pour itérer sur le flow de chat côté backend :

```bash
cd functions && npm run genkit:dev   # Genkit Developer UI
```

## 7. Déployer le front

```bash
npm run build                 # génère ./out (export statique)
firebase deploy --only hosting
```

Vérifier dans **Authentication → Settings → Domaines autorisés** que
`spak-174b7.web.app` est présent.

## Utiliser les assistants

1. **Admin → Nouvel assistant** : nom, description, prompt système.
   La base de connaissance Vertex AI Search se provisionne (statut *En préparation*
   → *Prêt*, quelques minutes).
2. Déplier l'assistant → **Ajouter des documents** (PDF, TXT, MD, HTML, DOCX, PPTX).
   Statut par document : *Indexation…* → *Indexé*.
3. **Assistants** (sidebar) → ouvrir un assistant → poser une question.
   Les réponses citent les passages sources.

## Structure

```
app/
  login/                     page de connexion (Google Sign-In)
  dashboard/                 shell protégé (sidebar)
    assistants/              liste des assistants
    chat/?a=<id>&c=<conv>    conversation
    admin/                   CRUD assistants + upload documents (admin only)
lib/
  firebase.ts                init client Firebase (auth, db, functions, storage)
  assistants.ts              requêtes Firestore + wrappers callable + upload
contexts/AuthContext.tsx     état utilisateur global + rôle admin (custom claim)
components/                  Sidebar, ChatWindow, AssistantCard, admin/*
functions/
  src/genkit.ts              instance Genkit (plugin Vertex AI)
  src/flows/chat.ts          flow de chat (RAG + streaming)
  src/lib/discoveryengine.ts data stores & import de documents (Vertex AI Search)
  src/index.ts               chat / createAssistant / deleteAssistant / ingestDocument
  scripts/set-admin.mjs      attribue le custom claim `admin`
firestore.rules, storage.rules
```

## Modèle de données Firestore

```
users/{uid}                          profil (+ claim admin hors Firestore)
assistants/{id}                      name, systemPrompt, model, dataStoreId, status
assistants/{id}/documents/{docId}    filename, status
conversations/{id}                   assistantId, userId, title, lastMessageAt
conversations/{id}/messages/{msgId}  role, content, citations[]
```

## Prochaines étapes suggérées

1. **Rendez-vous** : intégration Google Calendar API, lecture/écriture de créneaux.
2. **Articles** : CRUD Firestore + Cloud Storage, indexation automatique dans les
   bases de connaissance des assistants.
3. **App Check** (reCAPTCHA v3) pour verrouiller l'accès aux functions IA.

# Atelier — POC IA (fondations : auth + front)

Première brique du POC : authentification Google via Firebase et shell de
dashboard. Les modules Rendez-vous, Articles et Assistants sont
placeholders, à construire dans les prochaines itérations.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Firebase Authentication (Google Sign-In)
- Firestore (profils utilisateurs)

## 1. Créer le projet Firebase

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) → **Ajouter un projet**.
2. Dans le projet, **Authentication** → onglet **Sign-in method** → active **Google**.
3. **Firestore Database** → **Créer une base de données** → mode production.
4. **Paramètres du projet** (roue crantée) → **Général** → section **Vos applications** → **Ajouter une application** → icône Web (`</>`).
5. Copie les valeurs de configuration affichées (`apiKey`, `authDomain`, etc.).

## 2. Configurer le projet local

```bash
cp .env.local.example .env.local
```

Colle les valeurs récupérées à l'étape précédente dans `.env.local`.

## 3. Déployer les règles Firestore

Avec la [CLI Firebase](https://firebase.google.com/docs/cli) :

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # sélectionne le projet créé plus haut
firebase deploy --only firestore:rules
```

Ou colle simplement le contenu de `firestore.rules` dans
Firestore Database → Règles, dans la console.

## 4. Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) → redirection automatique
vers `/login` → connexion Google → `/dashboard`.

## 5. Déployer (Firebase Hosting)

```bash
npm run build
firebase init hosting   # choisir "out" ou config Next.js selon l'option retenue
firebase deploy --only hosting
```

> Pour un déploiement Next.js complet (SSR), Firebase propose désormais
> l'intégration native App Hosting — sinon un export statique classique
> suffit pour ce POC.

## Structure

```
app/
  login/          → page de connexion (Google Sign-In)
  dashboard/       → shell protégé (sidebar + placeholders modules)
lib/firebase.ts     → init client Firebase + helpers auth
contexts/AuthContext.tsx → état utilisateur global (React Context)
components/          → Sidebar, GoogleSignInButton
firestore.rules      → règles de sécurité (collection users uniquement pour l'instant)
```

## Prochaines étapes suggérées

1. **Assistants IA** : intégrer Vertex AI Search (une base de connaissance par assistant) + Gemini API.
2. **Rendez-vous** : intégration Google Calendar API, lecture/écriture de créneaux.
3. **Articles** : CRUD Firestore + Cloud Storage pour les médias, indexation dans les bases de connaissance des assistants.

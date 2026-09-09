/**
 * Donne (ou retire) le rôle admin à un utilisateur via un custom claim.
 *
 * Usage (depuis la racine du repo) :
 *   cd functions && node ../scripts/set-admin.mjs <email> [--remove]
 *
 * Identifiants : soit GOOGLE_APPLICATION_CREDENTIALS pointe vers une clé de
 * compte de service, soit un fichier ./service-account.json est présent à la
 * racine, soit les identifiants par défaut de l'environnement (ADC) sont
 * disponibles. Générer une clé : Console Firebase > Paramètres du projet >
 * Comptes de service > Générer une nouvelle clé privée.
 */
import admin from "firebase-admin";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const email = process.argv[2];
const remove = process.argv.includes("--remove");

if (!email) {
  console.error("Usage: node ../scripts/set-admin.mjs <email> [--remove]");
  process.exit(1);
}

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  resolve(process.cwd(), "../service-account.json");

admin.initializeApp({
  credential: existsSync(keyPath)
    ? admin.credential.cert(JSON.parse(readFileSync(keyPath, "utf8")))
    : admin.credential.applicationDefault(),
});

const user = await admin.auth().getUserByEmail(email);
await admin.auth().setCustomUserClaims(user.uid, remove ? {} : { admin: true });

console.log(
  `${remove ? "🚫 Rôle admin retiré" : "✅ Rôle admin accordé"} : ${email} (${user.uid}).`
);
console.log("L'utilisateur doit se déconnecter/reconnecter pour rafraîchir son jeton.");
process.exit(0);

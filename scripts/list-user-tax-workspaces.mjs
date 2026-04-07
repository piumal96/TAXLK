/**
 * List documents in Firestore `user_data` (tax workspace fields — Admin SDK — bypasses client rules).
 *
 * Usage:
 *   node scripts/list-user-tax-workspaces.mjs <path-to-service-account.json>
 *
 * Service account: Firebase Console → Project **taxlk-13159** → Project settings →
 * Service accounts → Generate new private key (keep secret; never commit).
 */

import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountPath = process.argv[2];

if (!serviceAccountPath) {
  console.error('\nUsage: node scripts/list-user-tax-workspaces.mjs <path-to-service-account.json>\n');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
} catch {
  console.error(`Could not read: ${serviceAccountPath}`);
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const col = db.collection('user_data');
const snap = await col.limit(50).get();

if (snap.empty) {
  console.log('\nNo documents in collection "user_data".');
  console.log('Either nothing has synced yet, or you are connected to the wrong Firebase project.\n');
  console.log('Expected project_id in the service account JSON should match your app (e.g. taxlk-13159).\n');
  process.exit(0);
}

console.log(`\nuser_data — ${snap.size} document(s) (max 50 shown):\n`);
for (const doc of snap.docs) {
  const d = doc.data();
  const inc = Array.isArray(d.incomeSources) ? d.incomeSources.length : 0;
  const hist = Array.isArray(d.history) ? d.history.length : 0;
  const updated =
    d.updated_at?.toDate?.()?.toISOString?.() ?? String(d.updated_at ?? 'n/a');
  console.log(`  uid: ${doc.id}`);
  console.log(`    incomeSources: ${inc}, history: ${hist}, updated_at: ${updated}`);
  console.log('');
}

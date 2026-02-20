import admin from 'firebase-admin';

function getPrivateKey(): string {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
  }
  // Three possible formats depending on how the env var was set:
  // 1. Already has real newlines (local .env.local)  → use as-is
  // 2. Has only literal \n (Vercel dashboard paste)  → replace \n → newline
  // 3. Has BOTH (corrupted)                          → strip real newlines first, then replace literal \n
  if (key.includes('\n') && !key.includes('\\n')) {
    // Case 1: already valid PEM with real newlines
    return key;
  }
  // Case 2 & 3: normalize by stripping any real newlines first, then replace literal \n
  return key.replace(/\n/g, '').replace(/\\n/g, '\n');
}

function initFirebase() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!projectId) throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
  if (!clientEmail) throw new Error('FIREBASE_CLIENT_EMAIL environment variable is not set');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: getPrivateKey(),
      }),
      databaseURL,
    });
    console.log('[Firebase] Admin SDK initialized successfully. Project:', projectId);
  } catch (err) {
    console.error('[Firebase] Failed to initialize Admin SDK:', err);
    throw err;
  }
}

// Initialize on module load
initFirebase();

export const db   = admin.firestore();
export const rtdb = admin.database();
export default admin;

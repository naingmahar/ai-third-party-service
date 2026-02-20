import admin from 'firebase-admin';

function getPrivateKey(): string {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
  }
  // Vercel can store the key in two ways:
  // 1. With literal \n characters (needs replacement)
  // 2. With real newlines already (no replacement needed)
  // Handle both cases:
  if (key.includes('\\n')) {
    return key.replace(/\\n/g, '\n');
  }
  return key;
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

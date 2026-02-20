import { db, rtdb } from './admin';
import { GoogleTokens } from '@/types/google';

// Storage key / document ID — change per user in multi-user apps
const TOKEN_KEY = process.env.TOKEN_STORAGE_KEY || 'default';

// -------------------------------------------------------------------
// Choose backend: TOKEN_STORAGE=firestore | rtdb (Realtime Database)
// -------------------------------------------------------------------
const BACKEND = process.env.TOKEN_STORAGE || 'firestore';

// ── Firestore ────────────────────────────────────────────────────────

async function firestoreSave(tokens: GoogleTokens): Promise<void> {
  try {
    await db
      .collection('oauth_tokens')
      .doc(TOKEN_KEY)
      .set({ ...tokens, updatedAt: Date.now() });
    console.log('[TokenStorage] Saved tokens to Firestore. doc:', TOKEN_KEY);
  } catch (err) {
    console.error('[TokenStorage] Firestore save failed:', err);
    throw err;
  }
}

async function firestoreLoad(): Promise<GoogleTokens | null> {
  try {
    const snap = await db.collection('oauth_tokens').doc(TOKEN_KEY).get();
    if (!snap.exists) {
      console.log('[TokenStorage] No tokens found in Firestore. doc:', TOKEN_KEY);
      return null;
    }
    const data = snap.data();
    if (!data) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt, ...tokens } = data;
    console.log('[TokenStorage] Loaded tokens from Firestore. doc:', TOKEN_KEY);
    return tokens as GoogleTokens;
  } catch (err) {
    console.error('[TokenStorage] Firestore load failed:', err);
    throw err;
  }
}

async function firestoreDelete(): Promise<void> {
  try {
    await db.collection('oauth_tokens').doc(TOKEN_KEY).delete();
    console.log('[TokenStorage] Deleted tokens from Firestore. doc:', TOKEN_KEY);
  } catch (err) {
    console.error('[TokenStorage] Firestore delete failed:', err);
    throw err;
  }
}

// ── Realtime Database ────────────────────────────────────────────────

async function rtdbSave(tokens: GoogleTokens): Promise<void> {
  try {
    await rtdb
      .ref(`oauth_tokens/${TOKEN_KEY}`)
      .set({ ...tokens, updatedAt: Date.now() });
    console.log('[TokenStorage] Saved tokens to RTDB. path: oauth_tokens/' + TOKEN_KEY);
  } catch (err) {
    console.error('[TokenStorage] RTDB save failed:', err);
    throw err;
  }
}

async function rtdbLoad(): Promise<GoogleTokens | null> {
  try {
    const snap = await rtdb.ref(`oauth_tokens/${TOKEN_KEY}`).get();
    if (!snap.exists()) {
      console.log('[TokenStorage] No tokens found in RTDB. path: oauth_tokens/' + TOKEN_KEY);
      return null;
    }
    const data = snap.val();
    if (!data) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt, ...tokens } = data;
    console.log('[TokenStorage] Loaded tokens from RTDB. path: oauth_tokens/' + TOKEN_KEY);
    return tokens as GoogleTokens;
  } catch (err) {
    console.error('[TokenStorage] RTDB load failed:', err);
    throw err;
  }
}

async function rtdbDelete(): Promise<void> {
  try {
    await rtdb.ref(`oauth_tokens/${TOKEN_KEY}`).remove();
    console.log('[TokenStorage] Deleted tokens from RTDB. path: oauth_tokens/' + TOKEN_KEY);
  } catch (err) {
    console.error('[TokenStorage] RTDB delete failed:', err);
    throw err;
  }
}

// ── Public API ───────────────────────────────────────────────────────

export async function saveTokensToFirebase(tokens: GoogleTokens): Promise<void> {
  console.log('[TokenStorage] saveTokens called. backend:', BACKEND, 'key:', TOKEN_KEY);
  if (BACKEND === 'rtdb') {
    return rtdbSave(tokens);
  }
  return firestoreSave(tokens);
}

export async function loadTokensFromFirebase(): Promise<GoogleTokens | null> {
  console.log('[TokenStorage] loadTokens called. backend:', BACKEND, 'key:', TOKEN_KEY);
  if (BACKEND === 'rtdb') {
    return rtdbLoad();
  }
  return firestoreLoad();
}

export async function deleteTokensFromFirebase(): Promise<void> {
  console.log('[TokenStorage] deleteTokens called. backend:', BACKEND, 'key:', TOKEN_KEY);
  if (BACKEND === 'rtdb') {
    return rtdbDelete();
  }
  return firestoreDelete();
}

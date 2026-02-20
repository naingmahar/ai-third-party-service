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
  await db
    .collection('oauth_tokens')
    .doc(TOKEN_KEY)
    .set({ ...tokens, updatedAt: Date.now() });
}

async function firestoreLoad(): Promise<GoogleTokens | null> {
  const snap = await db.collection('oauth_tokens').doc(TOKEN_KEY).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data) return null;
  // Remove Firestore-only field before returning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updatedAt, ...tokens } = data;
  return tokens as GoogleTokens;
}

async function firestoreDelete(): Promise<void> {
  await db.collection('oauth_tokens').doc(TOKEN_KEY).delete();
}

// ── Realtime Database ────────────────────────────────────────────────

async function rtdbSave(tokens: GoogleTokens): Promise<void> {
  await rtdb
    .ref(`oauth_tokens/${TOKEN_KEY}`)
    .set({ ...tokens, updatedAt: Date.now() });
}

async function rtdbLoad(): Promise<GoogleTokens | null> {
  const snap = await rtdb.ref(`oauth_tokens/${TOKEN_KEY}`).get();
  if (!snap.exists()) return null;
  const data = snap.val();
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updatedAt, ...tokens } = data;
  return tokens as GoogleTokens;
}

async function rtdbDelete(): Promise<void> {
  await rtdb.ref(`oauth_tokens/${TOKEN_KEY}`).remove();
}

// ── Public API ───────────────────────────────────────────────────────

export async function saveTokensToFirebase(tokens: GoogleTokens): Promise<void> {
  if (BACKEND === 'rtdb') {
    return rtdbSave(tokens);
  }
  return firestoreSave(tokens);
}

export async function loadTokensFromFirebase(): Promise<GoogleTokens | null> {
  if (BACKEND === 'rtdb') {
    return rtdbLoad();
  }
  return firestoreLoad();
}

export async function deleteTokensFromFirebase(): Promise<void> {
  if (BACKEND === 'rtdb') {
    return rtdbDelete();
  }
  return firestoreDelete();
}

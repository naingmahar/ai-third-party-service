import { NextResponse } from 'next/server';

/**
 * GET /api/auth/debug
 * Returns environment variable status (values masked) to diagnose
 * Firebase / OAuth config issues in production.
 * ⚠️ Remove or secure this endpoint once issues are resolved.
 */
export async function GET() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

  // Test Firebase init independently
  let firebaseStatus = 'not tested';
  let firestoreStatus = 'not tested';
  try {
    const admin = (await import('@/lib/firebase/admin')).default;
    firebaseStatus = admin.apps.length > 0 ? 'initialized' : 'not initialized';
    // Quick Firestore ping
    const { db } = await import('@/lib/firebase/admin');
    await db.collection('oauth_tokens').doc('__health_check__').get();
    firestoreStatus = 'reachable';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    firebaseStatus = `error: ${msg}`;
    firestoreStatus = `error: ${msg}`;
  }

  return NextResponse.json({
    env: {
      GOOGLE_CLIENT_ID:     process.env.GOOGLE_CLIENT_ID     ? `set (${process.env.GOOGLE_CLIENT_ID.slice(0,8)}...)` : 'MISSING',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'MISSING',
      GOOGLE_REDIRECT_URI:  process.env.GOOGLE_REDIRECT_URI  || 'MISSING',
      NEXTAUTH_URL:         process.env.NEXTAUTH_URL          || 'MISSING',
      TOKEN_STORAGE:        process.env.TOKEN_STORAGE         || 'firestore (default)',
      TOKEN_STORAGE_KEY:    process.env.TOKEN_STORAGE_KEY     || 'default (default)',
      FIREBASE_PROJECT_ID:  process.env.FIREBASE_PROJECT_ID  || 'MISSING',
      FIREBASE_DATABASE_URL:process.env.FIREBASE_DATABASE_URL || 'MISSING',
      FIREBASE_CLIENT_EMAIL:process.env.FIREBASE_CLIENT_EMAIL || 'MISSING',
      FIREBASE_PRIVATE_KEY: privateKey
        ? `set (${privateKey.length} chars, starts: ${privateKey.slice(0, 27)}..., has_literal_backslash_n: ${privateKey.includes('\\n')}, has_real_newline: ${privateKey.includes('\n')})`
        : 'MISSING',
    },
    firebase: {
      status: firebaseStatus,
      firestore: firestoreStatus,
    },
  });
}

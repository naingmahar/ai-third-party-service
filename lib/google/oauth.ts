import { OAuth2Client } from 'google-auth-library';
import { GoogleTokens, GoogleUserInfo } from '@/types/google';
import {
  saveTokensToFirebase,
  loadTokensFromFirebase,
  deleteTokensFromFirebase,
} from '@/lib/firebase/tokenStorage';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/analytics.readonly',
  'openid',
  'email',
  'profile',
];

// 3 months in milliseconds
const SESSION_TTL_MS = 3 * 30 * 24 * 60 * 60 * 1000;

export function createOAuth2Client(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ||
      'https://ai-third-party-service-vercel.vercel.app/api/auth/callback'
  );
}

export function getAuthorizationUrl(state?: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state || 'default',
  });
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  const tokensWithExpiry: GoogleTokens = {
    ...(tokens as GoogleTokens),
    session_expiry: Date.now() + SESSION_TTL_MS,
  };
  await saveTokens(tokensWithExpiry);
  return tokensWithExpiry;
}

export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const client = createOAuth2Client();
  const tokens = await loadTokens();

  if (!tokens) {
    throw new Error('No tokens found. Please authenticate first via /api/auth/login');
  }

  // Check 3-month session expiry
  if (tokens.session_expiry && tokens.session_expiry < Date.now()) {
    throw new Error('Session expired after 3 months. Please re-authenticate via /api/auth/login');
  }

  if (!tokens.refresh_token) {
    throw new Error('No refresh token available. Please re-authenticate via /api/auth/login');
  }

  client.setCredentials(tokens);

  // Auto-refresh access token if expired (~1 hour)
  if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
    const { credentials } = await client.refreshAccessToken();
    // Preserve refresh_token and session_expiry — Google only sends refresh_token once
    const refreshed: GoogleTokens = {
      ...tokens,
      ...(credentials as GoogleTokens),
      refresh_token: tokens.refresh_token,
      session_expiry: tokens.session_expiry,
    };
    await saveTokens(refreshed);
    client.setCredentials(refreshed);
  }

  return client;
}

export async function saveTokens(tokens: GoogleTokens): Promise<void> {
  await saveTokensToFirebase(tokens);
}

export async function loadTokens(): Promise<GoogleTokens | null> {
  return loadTokensFromFirebase();
}

export async function revokeTokens(): Promise<void> {
  const tokens = await loadTokens();
  if (tokens?.access_token) {
    const client = createOAuth2Client();
    client.setCredentials(tokens);
    await client.revokeToken(tokens.access_token).catch(() => null);
  }
  await deleteTokensFromFirebase();
}

export async function getUserInfo(client: OAuth2Client): Promise<GoogleUserInfo> {
  const ticket = await client
    .verifyIdToken({
      idToken: client.credentials.id_token || '',
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    .catch(() => null);

  if (ticket) {
    const payload = ticket.getPayload();
    if (payload) {
      return {
        id: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture,
      };
    }
  }

  // Fallback: fetch from userinfo endpoint
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${client.credentials.access_token}` },
  });
  return response.json();
}

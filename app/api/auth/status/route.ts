import { NextResponse } from 'next/server';
import { loadTokens, getAuthenticatedClient, getUserInfo } from '@/lib/google/oauth';

export async function GET() {
  try {
    const tokens = await loadTokens();

    if (!tokens) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        message: 'Not authenticated. Visit /api/auth/login to authenticate.',
      });
    }

    const isExpired = tokens.expiry_date ? tokens.expiry_date < Date.now() : false;

    let userInfo = null;
    if (!isExpired || tokens.refresh_token) {
      try {
        const client = await getAuthenticatedClient();
        userInfo = await getUserInfo(client);
      } catch {
        // Token may be invalid
      }
    }

    const sessionExpired = tokens.session_expiry ? tokens.session_expiry < Date.now() : false;

    return NextResponse.json({
      success: true,
      authenticated: true,
      tokenExpired: isExpired,
      sessionExpired,
      hasRefreshToken: !!tokens.refresh_token,
      sessionExpiresAt: tokens.session_expiry ? new Date(tokens.session_expiry).toISOString() : null,
      user: userInfo,
      scopes: tokens.scope?.split(' '),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

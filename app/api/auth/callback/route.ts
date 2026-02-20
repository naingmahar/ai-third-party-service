import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, createOAuth2Client, getUserInfo } from '@/lib/google/oauth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json(
      { success: false, error: `Google OAuth error: ${error}` },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { success: false, error: 'No authorization code received' },
      { status: 400 }
    );
  }

  try {
    console.log('[Auth/Callback] Exchanging code for tokens...');
    const tokens = await exchangeCodeForTokens(code);
    console.log('[Auth/Callback] Tokens received. has_refresh_token:', !!tokens.refresh_token);

    const client = createOAuth2Client();
    client.setCredentials(tokens);
    const userInfo = await getUserInfo(client);
    console.log('[Auth/Callback] Auth complete for user:', userInfo.email);

    return NextResponse.json({
      success: true,
      message: 'Authentication successful! Tokens saved.',
      user: userInfo,
      scopes: tokens.scope?.split(' '),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack   = err instanceof Error ? err.stack   : undefined;
    console.error('[Auth/Callback] Error:', message, stack);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to exchange code for tokens',
        details: message,
      },
      { status: 500 }
    );
  }
}

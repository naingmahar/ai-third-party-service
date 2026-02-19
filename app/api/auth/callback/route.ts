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
    const tokens = await exchangeCodeForTokens(code);
    const client = createOAuth2Client();
    client.setCredentials(tokens);
    const userInfo = await getUserInfo(client);

    // In production: redirect to frontend with session cookie
    return NextResponse.json({
      success: true,
      message: 'Authentication successful! Tokens saved.',
      user: userInfo,
      scopes: tokens.scope?.split(' '),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to exchange code for tokens', details: String(err) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, createOAuth2Client, getUserInfo } from '@/lib/google/oauth';

function htmlPage(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #030712;
      color: #f9fafb;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      width: 100%;
      margin: 20px;
      text-align: center;
    }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    .subtitle { color: #9ca3af; font-size: 14px; margin-bottom: 24px; }
    .user-card {
      background: #1f2937;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      text-align: left;
      margin-bottom: 24px;
    }
    .avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: #374151;
      overflow: hidden;
      flex-shrink: 0;
    }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .user-name { font-weight: 600; font-size: 15px; }
    .user-email { color: #9ca3af; font-size: 13px; margin-top: 2px; }
    .session-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #052e16;
      color: #4ade80;
      border: 1px solid #166534;
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 13px;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: opacity 0.2s;
      margin: 4px;
    }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: #4f46e5; color: #fff; }
    .btn-secondary { background: #1f2937; color: #d1d5db; border: 1px solid #374151; }
    .error-box {
      background: #1c0a0a;
      border: 1px solid #7f1d1d;
      border-radius: 10px;
      padding: 14px 18px;
      text-align: left;
      margin-bottom: 24px;
      color: #fca5a5;
      font-size: 13px;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div class="card">
    ${body}
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return htmlPage('Auth Failed', `
      <div class="icon">❌</div>
      <h1>Authentication Failed</h1>
      <p class="subtitle">Google returned an error during sign-in.</p>
      <div class="error-box">${error}</div>
      <a href="/api/auth/login" class="btn btn-primary">Try Again</a>
      <a href="/" class="btn btn-secondary">Home</a>
    `);
  }

  if (!code) {
    return htmlPage('Auth Failed', `
      <div class="icon">⚠️</div>
      <h1>No Authorization Code</h1>
      <p class="subtitle">The OAuth callback did not receive a code from Google.</p>
      <a href="/api/auth/login" class="btn btn-primary">Try Again</a>
      <a href="/" class="btn btn-secondary">Home</a>
    `);
  }

  try {
    console.log('[Auth/Callback] Exchanging code for tokens...');
    const tokens = await exchangeCodeForTokens(code);
    console.log('[Auth/Callback] Tokens received. has_refresh_token:', !!tokens.refresh_token);

    const client = createOAuth2Client();
    client.setCredentials(tokens);
    const userInfo = await getUserInfo(client);
    console.log('[Auth/Callback] Auth complete for user:', userInfo.email);

    const sessionDate = tokens.session_expiry
      ? new Date(tokens.session_expiry).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '3 months';

    return htmlPage('Authentication Successful', `
      <div class="icon">✅</div>
      <h1>Authentication Successful</h1>
      <p class="subtitle">Tokens saved to Firebase. You're all set.</p>
      <div class="user-card">
        <div class="avatar">
          ${userInfo.picture ? `<img src="${userInfo.picture}" alt="avatar" />` : '👤'}
        </div>
        <div>
          <div class="user-name">${userInfo.name || 'User'}</div>
          <div class="user-email">${userInfo.email}</div>
        </div>
      </div>
      <div class="session-badge">
        🔐 Session valid until ${sessionDate}
      </div>
      <br/>
      <a href="/playground" class="btn btn-primary">Open Playground</a>
      <a href="/" class="btn btn-secondary">Home</a>
    `);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Auth/Callback] Error:', message);
    return htmlPage('Auth Failed', `
      <div class="icon">❌</div>
      <h1>Authentication Error</h1>
      <p class="subtitle">Something went wrong while saving your tokens.</p>
      <div class="error-box">${message}</div>
      <a href="/api/auth/login" class="btn btn-primary">Try Again</a>
      <a href="/" class="btn btn-secondary">Home</a>
    `);
  }
}

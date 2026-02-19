import { NextResponse } from 'next/server';
import { revokeTokens } from '@/lib/google/oauth';

export async function POST() {
  try {
    await revokeTokens();
    return NextResponse.json({ success: true, message: 'Logged out and tokens revoked.' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to revoke tokens', details: String(error) },
      { status: 500 }
    );
  }
}

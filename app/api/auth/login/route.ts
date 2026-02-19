import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/google/oauth';

export async function GET() {
  try {
    const url = getAuthorizationUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate auth URL', details: String(error) },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types/google';

const DISABLED_RESPONSE: ApiResponse = {
  success: false,
  error: 'GA4 service is currently disabled.',
};

export async function GET(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json(DISABLED_RESPONSE, { status: 503 });
}

export async function POST(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json(DISABLED_RESPONSE, { status: 503 });
}

import { NextRequest, NextResponse } from 'next/server';
import { getEmail, getThread, markAsRead } from '@/lib/google/gmail';
import { ApiResponse } from '@/types/google';

/**
 * GET /api/gmail/[id]
 * Query params:
 *   - type: "message" (default) | "thread"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const { id } = await params;
  const type = request.nextUrl.searchParams.get('type') || 'message';

  try {
    if (type === 'thread') {
      const messages = await getThread(id);
      return NextResponse.json({ success: true, data: messages });
    }

    const message = await getEmail(id);
    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/gmail/[id]
 * Body: { action: "markRead" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const { id } = await params;

  try {
    const body = await request.json();

    if (body.action === 'markRead') {
      await markAsRead(id);
      return NextResponse.json({ success: true, message: 'Marked as read' });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${body.action}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

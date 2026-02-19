import { NextRequest, NextResponse } from 'next/server';
import { getEvent, updateEvent, deleteEvent } from '@/lib/google/calendar';
import { ApiResponse, CreateEventParams } from '@/types/google';

/**
 * GET /api/calendar/[id]
 * Query params:
 *   - calendarId: string (default "primary")
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const { id } = await params;
  const calendarId = request.nextUrl.searchParams.get('calendarId') || 'primary';

  try {
    const event = await getEvent(id, calendarId);
    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/calendar/[id]
 * Body: Partial<CreateEventParams> & { calendarId? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const { id } = await params;

  try {
    const body = await request.json() as Partial<CreateEventParams> & { calendarId?: string };
    const { calendarId, ...updateParams } = body;

    const event = await updateEvent(id, updateParams, calendarId || 'primary');
    return NextResponse.json({ success: true, message: 'Event updated', data: event });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/[id]
 * Query params:
 *   - calendarId: string (default "primary")
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const { id } = await params;
  const calendarId = request.nextUrl.searchParams.get('calendarId') || 'primary';

  try {
    await deleteEvent(id, calendarId);
    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

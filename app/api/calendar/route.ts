import { NextRequest, NextResponse } from 'next/server';
import { listEvents, createEvent, listCalendars, getTodayEvents } from '@/lib/google/calendar';
import { ApiResponse, CreateEventParams } from '@/types/google';

/**
 * GET /api/calendar
 * Query params:
 *   - calendarId: string (default "primary")
 *   - timeMin: ISO datetime string
 *   - timeMax: ISO datetime string
 *   - maxResults: number (default 10)
 *   - q: search query
 *   - pageToken: string
 *   - view: "calendars" | "today" | "events" (default)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get('view');
  const calendarId = searchParams.get('calendarId') || 'primary';

  try {
    if (view === 'calendars') {
      const calendars = await listCalendars();
      return NextResponse.json({ success: true, data: calendars });
    }

    if (view === 'today') {
      const events = await getTodayEvents(calendarId);
      return NextResponse.json({ success: true, data: events });
    }

    const result = await listEvents({
      calendarId,
      timeMin: searchParams.get('timeMin') || undefined,
      timeMax: searchParams.get('timeMax') || undefined,
      maxResults: Number(searchParams.get('maxResults')) || 10,
      query: searchParams.get('q') || undefined,
      pageToken: searchParams.get('pageToken') || undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar
 * Body: { summary, description?, location?, startDateTime, endDateTime, timeZone?, attendees? }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json() as CreateEventParams & { calendarId?: string };

    if (!body.summary || !body.startDateTime || !body.endDateTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: summary, startDateTime, endDateTime' },
        { status: 400 }
      );
    }

    const { calendarId, ...eventParams } = body;
    const event = await createEvent(eventParams, calendarId || 'primary');

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      data: event,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

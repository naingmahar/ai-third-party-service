import { NextRequest, NextResponse } from 'next/server';
import { listEmails, sendEmail, getProfile } from '@/lib/google/gmail';
import { ApiResponse, GmailMessageList, SendEmailParams } from '@/types/google';

/**
 * GET /api/gmail
 * Query params:
 *   - q: search query (e.g. "from:someone@example.com")
 *   - maxResults: number (default 10)
 *   - pageToken: string
 *   - labelIds: comma-separated label IDs (e.g. "INBOX,UNREAD")
 *   - profile: "true" to get profile info instead
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<GmailMessageList | object>>> {
  const searchParams = request.nextUrl.searchParams;

  if (searchParams.get('profile') === 'true') {
    try {
      const profile = await getProfile();
      return NextResponse.json({ success: true, data: profile });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: String(error) },
        { status: 500 }
      );
    }
  }

  try {
    const labelIdsParam = searchParams.get('labelIds');
    const result = await listEmails({
      query: searchParams.get('q') || undefined,
      maxResults: Number(searchParams.get('maxResults')) || 10,
      pageToken: searchParams.get('pageToken') || undefined,
      labelIds: labelIdsParam ? labelIdsParam.split(',') : undefined,
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
 * POST /api/gmail
 * Body: { to, subject, body, isHtml?, cc?, bcc? }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json() as SendEmailParams;

    if (!body.to || !body.subject || !body.body) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    const result = await sendEmail(body);
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

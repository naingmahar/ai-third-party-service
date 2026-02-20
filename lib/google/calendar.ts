import { google } from 'googleapis';
import { getAuthenticatedClient } from './oauth';
import { CalendarEvent, CreateEventParams } from '@/types/google';

function getCalendarClient() {
  return google.calendar({ version: 'v3' });
}

/**
 * List calendars for the authenticated user
 */
export async function listCalendars(): Promise<Array<{ id: string; summary: string; primary?: boolean }>> {
  const auth = await getAuthenticatedClient();
  const calendar = getCalendarClient();

  const res = await calendar.calendarList.list({ auth });
  return (res.data.items || []).map((item) => ({
    id: item.id || '',
    summary: item.summary || '',
    primary: item.primary || false,
  }));
}

/**
 * List upcoming events
 */
export async function listEvents(params?: {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  query?: string;
  pageToken?: string;
}): Promise<{ events: CalendarEvent[]; nextPageToken?: string }> {
  const auth = await getAuthenticatedClient();
  const calendar = getCalendarClient();

  const res = await calendar.events.list({
    auth,
    calendarId: params?.calendarId || 'primary',
    timeMin: params?.timeMin || new Date().toISOString(),
    timeMax: params?.timeMax,
    maxResults: params?.maxResults || 10,
    singleEvents: true,
    orderBy: 'startTime',
    q: params?.query,
    pageToken: params?.pageToken,
  });

  const events = (res.data.items || []).map(parseEvent);
  return {
    events,
    nextPageToken: res.data.nextPageToken || undefined,
  };
}

/**
 * Get a single event by ID
 */
export async function getEvent(eventId: string, calendarId = 'primary'): Promise<CalendarEvent> {
  const auth = await getAuthenticatedClient();
  const calendar = getCalendarClient();

  const res = await calendar.events.get({
    auth,
    calendarId,
    eventId,
  });

  return parseEvent(res.data);
}

/**
 * Create a new calendar event
 */
export async function createEvent(
  params: CreateEventParams,
  calendarId = 'primary'
): Promise<CalendarEvent> {
  const auth = await getAuthenticatedClient();
  const calendar = getCalendarClient();

  const eventBody = {
    summary: params.summary,
    description: params.description,
    location: params.location,
    start: {
      dateTime: normalizeDateTime(params.startDateTime),
      timeZone: params.timeZone || 'UTC',
    },
    end: {
      dateTime: normalizeDateTime(params.endDateTime),
      timeZone: params.timeZone || 'UTC',
    },
    attendees: params.attendees?.map((email) => ({ email })),
  };

  const res = await calendar.events.insert({
    auth,
    calendarId,
    requestBody: eventBody,
    sendNotifications: true,
  });

  return parseEvent(res.data);
}

/**
 * Update an existing calendar event
 */
export async function updateEvent(
  eventId: string,
  params: Partial<CreateEventParams>,
  calendarId = 'primary'
): Promise<CalendarEvent> {
  const auth = await getAuthenticatedClient();
  const calendar = getCalendarClient();

  const existing = await getEvent(eventId, calendarId);

  const updatedBody = {
    summary: params.summary ?? existing.summary,
    description: params.description ?? existing.description,
    location: params.location ?? existing.location,
    start: params.startDateTime
      ? { dateTime: normalizeDateTime(params.startDateTime), timeZone: params.timeZone || 'UTC' }
      : existing.start,
    end: params.endDateTime
      ? { dateTime: normalizeDateTime(params.endDateTime), timeZone: params.timeZone || 'UTC' }
      : existing.end,
    attendees: params.attendees
      ? params.attendees.map((email) => ({ email }))
      : existing.attendees,
  };

  const res = await calendar.events.update({
    auth,
    calendarId,
    eventId,
    requestBody: updatedBody,
  });

  return parseEvent(res.data);
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(eventId: string, calendarId = 'primary'): Promise<void> {
  const auth = await getAuthenticatedClient();
  const calendar = getCalendarClient();

  await calendar.events.delete({ auth, calendarId, eventId });
}

/**
 * Get today's events
 */
export async function getTodayEvents(calendarId = 'primary'): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  const { events } = await listEvents({
    calendarId,
    timeMin: startOfDay,
    timeMax: endOfDay,
    maxResults: 50,
  });

  return events;
}

// ---- Helpers ----

/**
 * Normalize a datetime string to full RFC 3339 format required by Google Calendar API.
 * Handles:
 *   "2026-02-21T10:07"           → "2026-02-21T10:07:00"
 *   "2026-02-21T10:07:00"        → "2026-02-21T10:07:00"  (unchanged)
 *   "2026-02-21T10:07:00Z"       → "2026-02-21T10:07:00Z" (unchanged)
 *   "2026-02-21T10:07:00+06:30"  → unchanged
 */
function normalizeDateTime(dt: string): string {
  // If it already has seconds (HH:MM:SS) leave it alone
  // Match pattern: T followed by HH:MM and nothing after (no seconds, no Z, no offset)
  return dt.replace(/T(\d{2}:\d{2})$/, 'T$1:00');
}

function parseEvent(data: {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  start?: { dateTime?: string | null; date?: string | null; timeZone?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null; timeZone?: string | null } | null;
  attendees?: Array<{ email?: string | null; displayName?: string | null }> | null;
  status?: string | null;
  htmlLink?: string | null;
}): CalendarEvent {
  return {
    id: data.id || undefined,
    summary: data.summary || '(No title)',
    description: data.description || undefined,
    location: data.location || undefined,
    start: {
      dateTime: data.start?.dateTime || undefined,
      date: data.start?.date || undefined,
      timeZone: data.start?.timeZone || undefined,
    },
    end: {
      dateTime: data.end?.dateTime || undefined,
      date: data.end?.date || undefined,
      timeZone: data.end?.timeZone || undefined,
    },
    attendees: data.attendees?.map((a) => ({
      email: a.email || '',
      displayName: a.displayName || undefined,
    })),
    status: data.status || undefined,
    htmlLink: data.htmlLink || undefined,
  };
}

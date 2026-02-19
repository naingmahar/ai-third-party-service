import { google } from 'googleapis';
import { getAuthenticatedClient } from './oauth';
import { GmailMessage, GmailMessageList, SendEmailParams } from '@/types/google';

function getGmailClient() {
  return google.gmail({ version: 'v1' });
}

/**
 * List emails from inbox
 */
export async function listEmails(params?: {
  query?: string;
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
}): Promise<GmailMessageList> {
  const auth = await getAuthenticatedClient();
  const gmail = getGmailClient();

  const listRes = await gmail.users.messages.list({
    auth,
    userId: 'me',
    q: params?.query,
    maxResults: params?.maxResults || 10,
    pageToken: params?.pageToken,
    labelIds: params?.labelIds,
  });

  const messageRefs = listRes.data.messages || [];
  const nextPageToken = listRes.data.nextPageToken || undefined;
  const resultSizeEstimate = listRes.data.resultSizeEstimate || 0;

  // Fetch full details for each message
  const messages = await Promise.all(
    messageRefs.map(async (ref) => {
      const msg = await gmail.users.messages.get({
        auth,
        userId: 'me',
        id: ref.id!,
        format: 'full',
      });
      return parseMessage(msg.data);
    })
  );

  return { messages, nextPageToken, resultSizeEstimate };
}

/**
 * Get a single email by ID
 */
export async function getEmail(messageId: string): Promise<GmailMessage> {
  const auth = await getAuthenticatedClient();
  const gmail = getGmailClient();

  const msg = await gmail.users.messages.get({
    auth,
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  return parseMessage(msg.data);
}

/**
 * Send an email
 */
export async function sendEmail(params: SendEmailParams): Promise<{ id: string; threadId: string }> {
  const auth = await getAuthenticatedClient();
  const gmail = getGmailClient();

  const contentType = params.isHtml ? 'text/html' : 'text/plain';
  const ccLine = params.cc ? `Cc: ${params.cc}\r\n` : '';
  const bccLine = params.bcc ? `Bcc: ${params.bcc}\r\n` : '';

  const raw = [
    `To: ${params.to}`,
    ccLine.trim(),
    bccLine.trim(),
    `Subject: ${params.subject}`,
    `Content-Type: ${contentType}; charset=utf-8`,
    '',
    params.body,
  ]
    .filter(Boolean)
    .join('\r\n');

  const encodedMessage = Buffer.from(raw).toString('base64url');

  const res = await gmail.users.messages.send({
    auth,
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });

  return { id: res.data.id!, threadId: res.data.threadId! };
}

/**
 * Get email thread
 */
export async function getThread(threadId: string): Promise<GmailMessage[]> {
  const auth = await getAuthenticatedClient();
  const gmail = getGmailClient();

  const thread = await gmail.users.threads.get({
    auth,
    userId: 'me',
    id: threadId,
    format: 'full',
  });

  return (thread.data.messages || []).map(parseMessage);
}

/**
 * Mark email as read
 */
export async function markAsRead(messageId: string): Promise<void> {
  const auth = await getAuthenticatedClient();
  const gmail = getGmailClient();

  await gmail.users.messages.modify({
    auth,
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}

/**
 * Get Gmail profile (email address, total messages, etc.)
 */
export async function getProfile(): Promise<{
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
}> {
  const auth = await getAuthenticatedClient();
  const gmail = getGmailClient();

  const profile = await gmail.users.getProfile({ auth, userId: 'me' });
  return {
    emailAddress: profile.data.emailAddress || '',
    messagesTotal: profile.data.messagesTotal || 0,
    threadsTotal: profile.data.threadsTotal || 0,
  };
}

// ---- Helpers ----

function getHeader(headers: Array<{ name?: string | null; value?: string | null }>, name: string): string {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

function decodeBody(data: string): string {
  return Buffer.from(data, 'base64').toString('utf-8');
}

function extractBody(payload: {
  body?: { data?: string | null } | null;
  parts?: Array<{ mimeType?: string | null; body?: { data?: string | null } | null }> | null;
  mimeType?: string | null;
}): string {
  if (payload.body?.data) {
    return decodeBody(payload.body.data);
  }
  if (payload.parts) {
    // Prefer HTML, fall back to plain text
    const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
    const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
    const part = htmlPart || textPart;
    if (part?.body?.data) {
      return decodeBody(part.body.data);
    }
  }
  return '';
}

function parseMessage(data: {
  id?: string | null;
  threadId?: string | null;
  snippet?: string | null;
  labelIds?: string[] | null;
  payload?: {
    headers?: Array<{ name?: string | null; value?: string | null }> | null;
    body?: { data?: string | null } | null;
    parts?: Array<{ mimeType?: string | null; body?: { data?: string | null } | null }> | null;
    mimeType?: string | null;
  } | null;
}): GmailMessage {
  const headers = data.payload?.headers || [];
  return {
    id: data.id || '',
    threadId: data.threadId || '',
    snippet: data.snippet || '',
    subject: getHeader(headers, 'subject'),
    from: getHeader(headers, 'from'),
    to: getHeader(headers, 'to'),
    date: getHeader(headers, 'date'),
    body: data.payload ? extractBody(data.payload) : '',
    labelIds: data.labelIds || [],
  };
}

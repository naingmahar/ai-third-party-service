export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_expiry?: number; // 3-month session TTL (Unix ms)
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Gmail Types
export interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  body?: string;
  labelIds?: string[];
}

export interface GmailMessageList {
  messages: GmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  cc?: string;
  bcc?: string;
}

// Calendar Types
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string; displayName?: string }>;
  status?: string;
  htmlLink?: string;
}

export interface CreateEventParams {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  attendees?: string[];
}

// GA4 Types
export interface GA4MetricValue {
  value: string;
}

export interface GA4DimensionValue {
  value: string;
}

export interface GA4Row {
  dimensionValues: GA4DimensionValue[];
  metricValues: GA4MetricValue[];
}

export interface GA4ReportResponse {
  dimensionHeaders: Array<{ name: string }>;
  metricHeaders: Array<{ name: string; type: string }>;
  rows: GA4Row[];
  totals?: GA4Row[];
  rowCount?: number;
}

export interface GA4ReportParams {
  startDate: string;  // e.g. '2024-01-01' or '7daysAgo'
  endDate: string;    // e.g. '2024-01-31' or 'today'
  metrics: string[];  // e.g. ['sessions', 'activeUsers', 'screenPageViews']
  dimensions?: string[]; // e.g. ['date', 'country', 'deviceCategory']
  limit?: number;
  orderBy?: Array<{ fieldName: string; descending?: boolean }>;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

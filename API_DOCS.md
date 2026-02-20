# AI Third-Party Service — API Documentation

Base URL: `https://ai-third-party-service-vercel.vercel.app`

All responses follow this structure:
```json
{ "success": true/false, "data": {}, "error": "message" }
```

---

## Authentication Flow

Before using any API, authenticate once:
1. Open browser → `GET /api/auth/login`
2. Complete Google consent screen
3. On success — a **UI page** is shown with your profile, session expiry and navigation buttons
4. Tokens are saved automatically to **Firebase Firestore** (valid for **3 months**)
5. All subsequent API calls use the saved tokens automatically

---

## 1. Authentication

### Login
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/auth/login` |
| **Params** | None |
| **Description** | Redirects to Google OAuth consent screen |

**Example:**
```
GET https://ai-third-party-service-vercel.vercel.app/api/auth/login
```

---

### OAuth Callback *(handled automatically)*
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/auth/callback` |
| **Params** | `code` (auto-provided by Google), `error` |
| **Description** | Exchanges code for tokens, saves to Firestore, shows success/error UI page |

**On success:** Shows UI with user profile picture, name, email, session expiry date and buttons to Playground / Home.
**On error:** Shows UI with error message and Try Again / Home buttons.

---

### Check Status
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/auth/status` |

**Example:**
```
GET https://ai-third-party-service-vercel.vercel.app/api/auth/status
```

**Response:**
```json
{
  "success": true,
  "authenticated": true,
  "tokenExpired": false,
  "sessionExpired": false,
  "hasRefreshToken": true,
  "sessionExpiresAt": "2026-05-19T10:00:00.000Z",
  "user": {
    "id": "1234567890",
    "email": "user@gmail.com",
    "name": "John Doe",
    "picture": "https://..."
  },
  "scopes": ["gmail.readonly", "calendar", "..."]
}
```

---

### Logout
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/auth/logout` |
| **Body** | None |
| **Description** | Revokes tokens and clears saved session from Firestore |

**Example:**
```
POST https://ai-third-party-service-vercel.vercel.app/api/auth/logout
```

---

### Debug *(for diagnosing config issues)*
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/auth/debug` |
| **Description** | Returns env var status and Firebase connectivity check |

**Example:**
```
GET https://ai-third-party-service-vercel.vercel.app/api/auth/debug
```

**Response:**
```json
{
  "env": {
    "GOOGLE_CLIENT_ID": "set (79311278...)",
    "FIREBASE_PROJECT_ID": "your-project-id",
    "TOKEN_STORAGE": "firestore",
    "FIREBASE_PRIVATE_KEY": "set (1735 chars ...)"
  },
  "firebase": {
    "status": "initialized",
    "firestore": "reachable"
  }
}
```

---

## 2. Gmail

### List Emails
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/gmail` |

| Query Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Gmail search query (e.g. `is:unread`, `from:boss@company.com`, `subject:invoice`) |
| `maxResults` | number | `10` | Number of emails to return (max 500) |
| `pageToken` | string | — | Token for next page (from previous response) |
| `labelIds` | string | — | Comma-separated label IDs (e.g. `INBOX,UNREAD`) |
| `profile` | boolean | — | Set `true` to get Gmail profile instead of emails |

**Example Requests:**
```
GET https://ai-third-party-service-vercel.vercel.app/api/gmail
GET https://ai-third-party-service-vercel.vercel.app/api/gmail?q=is:unread&maxResults=20
GET https://ai-third-party-service-vercel.vercel.app/api/gmail?q=from:boss@company.com
GET https://ai-third-party-service-vercel.vercel.app/api/gmail?labelIds=INBOX,UNREAD
GET https://ai-third-party-service-vercel.vercel.app/api/gmail?profile=true
```

**Response (emails):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "18abc123",
        "threadId": "18abc123",
        "subject": "Meeting Tomorrow",
        "from": "boss@company.com",
        "to": "me@gmail.com",
        "date": "Thu, 19 Feb 2026 10:00:00 +0000",
        "snippet": "Hi, just a reminder...",
        "body": "<full email body>",
        "labelIds": ["INBOX", "UNREAD"]
      }
    ],
    "nextPageToken": "abc123",
    "resultSizeEstimate": 142
  }
}
```

**Response (profile):**
```json
{
  "success": true,
  "data": {
    "emailAddress": "user@gmail.com",
    "messagesTotal": 5423,
    "threadsTotal": 1892
  }
}
```

---

### Get Single Email
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/gmail/{id}` |

| Query Param | Type | Default | Description |
|---|---|---|---|
| `type` | string | `message` | `message` for single email, `thread` for full thread |

**Example Requests:**
```
GET https://ai-third-party-service-vercel.vercel.app/api/gmail/18abc123
GET https://ai-third-party-service-vercel.vercel.app/api/gmail/18abc123?type=thread
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "18abc123",
    "threadId": "18abc123",
    "subject": "Meeting Tomorrow",
    "from": "boss@company.com",
    "to": "me@gmail.com",
    "date": "Thu, 19 Feb 2026 10:00:00 +0000",
    "body": "<full email body>",
    "labelIds": ["INBOX"]
  }
}
```

---

### Send Email
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/gmail` |
| **Content-Type** | `application/json` |

| Body Field | Type | Required | Description |
|---|---|---|---|
| `to` | string | Yes | Recipient email address |
| `subject` | string | Yes | Email subject |
| `body` | string | Yes | Email body content |
| `isHtml` | boolean | No | Set `true` to send HTML email (default `false`) |
| `cc` | string | No | CC email address |
| `bcc` | string | No | BCC email address |

**Example Request:**
```
POST https://ai-third-party-service-vercel.vercel.app/api/gmail
```
```json
{
  "to": "recipient@example.com",
  "subject": "Hello from AI",
  "body": "This email was sent by an AI agent.",
  "isHtml": false
}
```

**HTML Email Example:**
```json
{
  "to": "recipient@example.com",
  "subject": "Hello from AI",
  "body": "<h1>Hello!</h1><p>This is an <b>HTML</b> email.</p>",
  "isHtml": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "id": "18abc456",
    "threadId": "18abc456"
  }
}
```

---

### Mark Email as Read
| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/gmail/{id}` |
| **Content-Type** | `application/json` |

**Example Request:**
```
PATCH https://ai-third-party-service-vercel.vercel.app/api/gmail/18abc123
```
```json
{ "action": "markRead" }
```

**Response:**
```json
{ "success": true, "message": "Marked as read" }
```

---

## 3. Google Calendar

### List Events
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/calendar` |

| Query Param | Type | Default | Description |
|---|---|---|---|
| `view` | string | `events` | `events` (upcoming), `today` (today only), `calendars` (list all calendars) |
| `calendarId` | string | `primary` | Calendar ID (use `primary` for main calendar) |
| `timeMin` | string | now | Start datetime in ISO format (e.g. `2026-02-01T00:00:00Z`) |
| `timeMax` | string | — | End datetime in ISO format |
| `maxResults` | number | `10` | Number of events to return |
| `q` | string | — | Search query for event title/description |
| `pageToken` | string | — | Token for next page |

**Example Requests:**
```
GET https://ai-third-party-service-vercel.vercel.app/api/calendar
GET https://ai-third-party-service-vercel.vercel.app/api/calendar?view=today
GET https://ai-third-party-service-vercel.vercel.app/api/calendar?view=calendars
GET https://ai-third-party-service-vercel.vercel.app/api/calendar?maxResults=20&timeMin=2026-02-01T00:00:00Z
GET https://ai-third-party-service-vercel.vercel.app/api/calendar?q=standup
```

**Response (events):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "abc123xyz",
        "summary": "Team Standup",
        "description": "Daily sync",
        "location": "Zoom",
        "start": { "dateTime": "2026-02-20T09:00:00+06:30", "timeZone": "Asia/Yangon" },
        "end": { "dateTime": "2026-02-20T09:30:00+06:30", "timeZone": "Asia/Yangon" },
        "attendees": [{ "email": "colleague@company.com" }],
        "status": "confirmed",
        "htmlLink": "https://calendar.google.com/event?eid=..."
      }
    ],
    "nextPageToken": null
  }
}
```

---

### Get Single Event
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/calendar/{id}` |

| Query Param | Type | Default | Description |
|---|---|---|---|
| `calendarId` | string | `primary` | Calendar ID |

**Example Requests:**
```
GET https://ai-third-party-service-vercel.vercel.app/api/calendar/abc123xyz
GET https://ai-third-party-service-vercel.vercel.app/api/calendar/abc123xyz?calendarId=work@group.calendar.google.com
```

---

### Create Event
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/calendar` |
| **Content-Type** | `application/json` |

| Body Field | Type | Required | Description |
|---|---|---|---|
| `summary` | string | Yes | Event title |
| `startDateTime` | string | Yes | Datetime — `"2026-02-21T10:07"` or `"2026-02-21T10:07:00"` or `"2026-02-21T10:07:00+06:30"` |
| `endDateTime` | string | Yes | Datetime — same formats as startDateTime |
| `description` | string | No | Event description |
| `location` | string | No | Event location |
| `timeZone` | string | No | Timezone (default `UTC`, e.g. `Asia/Yangon`) |
| `attendees` | string[] | No | Array of attendee email addresses |
| `calendarId` | string | No | Calendar ID (default `primary`) |

> **Note:** `startDateTime` and `endDateTime` accept short format without seconds (e.g. `"2026-02-21T10:07"`) — seconds are added automatically.

**Example Request:**
```
POST https://ai-third-party-service-vercel.vercel.app/api/calendar
```
```json
{
  "summary": "Team Meeting",
  "description": "Monthly sync",
  "location": "Zoom",
  "startDateTime": "2026-02-21T10:07",
  "endDateTime": "2026-02-21T11:07",
  "timeZone": "Asia/Yangon",
  "attendees": ["colleague@example.com"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "newEventId123",
    "summary": "Team Meeting",
    "htmlLink": "https://calendar.google.com/event?eid=...",
    "start": { "dateTime": "2026-02-21T10:07:00", "timeZone": "Asia/Yangon" },
    "end": { "dateTime": "2026-02-21T11:07:00", "timeZone": "Asia/Yangon" }
  }
}
```

---

### Update Event
| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/calendar/{id}` |
| **Content-Type** | `application/json` |

All body fields are optional — only send what you want to change.

| Body Field | Type | Description |
|---|---|---|
| `summary` | string | New event title |
| `description` | string | New description |
| `location` | string | New location |
| `startDateTime` | string | New start datetime |
| `endDateTime` | string | New end datetime |
| `timeZone` | string | Timezone |
| `attendees` | string[] | Replace attendee list |
| `calendarId` | string | Calendar ID (default `primary`) |

**Example Request:**
```
PATCH https://ai-third-party-service-vercel.vercel.app/api/calendar/abc123xyz
```
```json
{
  "summary": "Team Meeting (Rescheduled)",
  "startDateTime": "2026-02-26T14:00",
  "endDateTime": "2026-02-26T15:00"
}
```

---

### Delete Event
| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `/api/calendar/{id}` |

| Query Param | Type | Default | Description |
|---|---|---|---|
| `calendarId` | string | `primary` | Calendar ID |

**Example Request:**
```
DELETE https://ai-third-party-service-vercel.vercel.app/api/calendar/abc123xyz
```

**Response:**
```json
{ "success": true, "message": "Event deleted" }
```

---

## Error Responses

| HTTP Status | Meaning |
|---|---|
| `400` | Bad request — missing or invalid parameters |
| `500` | Server error — check if authenticated, or Google API error |
| `503` | Service disabled |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Description of what went wrong",
  "details": "Detailed error message"
}
```

---

## Common Gmail Search Queries (`q` param)

| Query | Description |
|---|---|
| `is:unread` | Unread emails |
| `is:starred` | Starred emails |
| `from:boss@company.com` | From specific sender |
| `to:me@gmail.com` | Sent to specific address |
| `subject:invoice` | Subject contains "invoice" |
| `has:attachment` | Emails with attachments |
| `after:2026/01/01` | Emails after a date |
| `before:2026/02/01` | Emails before a date |
| `label:work` | Emails with label "work" |
| `is:unread from:boss@company.com` | Combine queries |

---

## Datetime Format Reference

Calendar API accepts flexible datetime formats — seconds are optional:

| Format | Example | Supported |
|---|---|---|
| Short (no seconds) | `2026-02-21T10:07` | ✅ Auto-normalized |
| With seconds | `2026-02-21T10:07:00` | ✅ |
| UTC | `2026-02-21T10:07:00Z` | ✅ |
| With offset | `2026-02-21T10:07:00+06:30` | ✅ |

---

## Session & Token Notes

- **Session duration:** 3 months from last login
- **Access token:** Auto-refreshed every ~1 hour (transparent)
- **Re-auth required:** After 3 months, or if user revokes access
- **Check expiry:** `GET /api/auth/status` → `sessionExpiresAt`
- **Token storage:** Firebase Firestore (collection: `oauth_tokens`, doc: `default`)

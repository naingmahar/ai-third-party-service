'use client';

import { useState, useCallback } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface Endpoint {
  id: string;
  label: string;
  method: HttpMethod;
  path: string;
  desc: string;
  pathParam?: string;
  queryParams?: { key: string; defaultValue: string; placeholder: string }[];
  bodyTemplate?: string;
}

interface Section {
  category: string;
  color: string;
  endpoints: Endpoint[];
}

const SECTIONS: Section[] = [
  {
    category: 'Auth',
    color: 'blue',
    endpoints: [
      {
        id: 'auth-status',
        label: 'Check Status',
        method: 'GET',
        path: '/api/auth/status',
        desc: 'Check authentication status & user info',
      },
      {
        id: 'auth-logout',
        label: 'Logout',
        method: 'POST',
        path: '/api/auth/logout',
        desc: 'Revoke tokens and logout',
      },
    ],
  },
  {
    category: 'Gmail',
    color: 'red',
    endpoints: [
      {
        id: 'gmail-list',
        label: 'List Emails',
        method: 'GET',
        path: '/api/gmail',
        desc: 'List inbox emails',
        queryParams: [
          { key: 'q', defaultValue: '', placeholder: 'e.g. is:unread' },
          { key: 'maxResults', defaultValue: '10', placeholder: '10' },
          { key: 'labelIds', defaultValue: '', placeholder: 'e.g. INBOX,UNREAD' },
        ],
      },
      {
        id: 'gmail-profile',
        label: 'Get Profile',
        method: 'GET',
        path: '/api/gmail',
        desc: 'Get Gmail profile info',
        queryParams: [{ key: 'profile', defaultValue: 'true', placeholder: 'true' }],
      },
      {
        id: 'gmail-get',
        label: 'Get Email by ID',
        method: 'GET',
        path: '/api/gmail/:id',
        desc: 'Get a single email by ID',
        pathParam: 'Message ID',
        queryParams: [{ key: 'type', defaultValue: 'message', placeholder: 'message or thread' }],
      },
      {
        id: 'gmail-send',
        label: 'Send Email',
        method: 'POST',
        path: '/api/gmail',
        desc: 'Send an email',
        bodyTemplate: JSON.stringify(
          { to: 'recipient@example.com', subject: 'Hello', body: 'Email body here', isHtml: false },
          null,
          2
        ),
      },
      {
        id: 'gmail-markread',
        label: 'Mark as Read',
        method: 'PATCH',
        path: '/api/gmail/:id',
        desc: 'Mark an email as read',
        pathParam: 'Message ID',
        bodyTemplate: JSON.stringify({ action: 'markRead' }, null, 2),
      },
    ],
  },
  {
    category: 'Calendar',
    color: 'green',
    endpoints: [
      {
        id: 'cal-list',
        label: 'List Events',
        method: 'GET',
        path: '/api/calendar',
        desc: 'List upcoming events',
        queryParams: [
          { key: 'maxResults', defaultValue: '10', placeholder: '10' },
          { key: 'q', defaultValue: '', placeholder: 'Search query' },
        ],
      },
      {
        id: 'cal-today',
        label: "Today's Events",
        method: 'GET',
        path: '/api/calendar',
        desc: "Get today's events",
        queryParams: [{ key: 'view', defaultValue: 'today', placeholder: 'today' }],
      },
      {
        id: 'cal-calendars',
        label: 'List Calendars',
        method: 'GET',
        path: '/api/calendar',
        desc: 'List all calendars',
        queryParams: [{ key: 'view', defaultValue: 'calendars', placeholder: 'calendars' }],
      },
      {
        id: 'cal-get',
        label: 'Get Event by ID',
        method: 'GET',
        path: '/api/calendar/:id',
        desc: 'Get a single event by ID',
        pathParam: 'Event ID',
      },
      {
        id: 'cal-create',
        label: 'Create Event',
        method: 'POST',
        path: '/api/calendar',
        desc: 'Create a new calendar event',
        bodyTemplate: JSON.stringify(
          {
            summary: 'Team Meeting',
            description: 'Monthly sync',
            location: 'Zoom',
            startDateTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
            endDateTime: new Date(Date.now() + 90000000).toISOString().slice(0, 16),
            timeZone: 'Asia/Yangon',
            attendees: [],
          },
          null,
          2
        ),
      },
      {
        id: 'cal-update',
        label: 'Update Event',
        method: 'PATCH',
        path: '/api/calendar/:id',
        desc: 'Update an existing event',
        pathParam: 'Event ID',
        bodyTemplate: JSON.stringify({ summary: 'Updated Title' }, null, 2),
      },
      {
        id: 'cal-delete',
        label: 'Delete Event',
        method: 'DELETE',
        path: '/api/calendar/:id',
        desc: 'Delete a calendar event',
        pathParam: 'Event ID',
      },
    ],
  },
];

const METHOD_STYLE: Record<HttpMethod, { badge: string; text: string }> = {
  GET: { badge: 'bg-blue-100 text-blue-700 border-blue-200', text: 'text-blue-600' },
  POST: { badge: 'bg-green-100 text-green-700 border-green-200', text: 'text-green-600' },
  PATCH: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: 'text-yellow-600' },
  DELETE: { badge: 'bg-red-100 text-red-700 border-red-200', text: 'text-red-600' },
};

const CATEGORY_COLOR: Record<string, string> = {
  blue: 'text-blue-600 bg-blue-50 border-blue-200',
  red: 'text-red-600 bg-red-50 border-red-200',
  green: 'text-green-600 bg-green-50 border-green-200',
};

export default function PlaygroundPage() {
  const [selected, setSelected] = useState<Endpoint>(SECTIONS[0].endpoints[0]);
  const [pathParam, setPathParam] = useState('');
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const selectEndpoint = useCallback((ep: Endpoint) => {
    setSelected(ep);
    setPathParam('');
    const defaults: Record<string, string> = {};
    ep.queryParams?.forEach((p) => { defaults[p.key] = p.defaultValue; });
    setQueryParams(defaults);
    setBody(ep.bodyTemplate || '');
    setResponse(null);
    setStatus(null);
    setElapsed(null);
  }, []);

  const buildUrl = () => {
    let url = selected.path;
    if (selected.pathParam && pathParam) {
      url = url.replace(':id', encodeURIComponent(pathParam));
    } else if (selected.pathParam) {
      url = url.replace(':id', '{id}');
    }
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  };

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);
    setStatus(null);
    const start = Date.now();
    try {
      const url = buildUrl();
      const options: RequestInit = { method: selected.method };
      if (['POST', 'PATCH'].includes(selected.method) && body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = body;
      }
      const res = await fetch(url, options);
      setStatus(res.status);
      setElapsed(Date.now() - start);
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err) {
      setResponse(String(err));
      setElapsed(Date.now() - start);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = () => {
    if (!status) return 'text-gray-500';
    if (status < 300) return 'text-green-600';
    if (status < 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  const previewUrl = buildUrl();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden shrink-0">
        <div className="px-4 py-4 border-b border-gray-800">
          <h1 className="text-sm font-bold text-white tracking-wide">API Playground</h1>
          <p className="text-xs text-gray-400 mt-0.5">AI Third-Party Service</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map((section) => (
            <div key={section.category} className="mb-1">
              <div className={`mx-3 my-1 px-2 py-1 text-xs font-semibold rounded border ${CATEGORY_COLOR[section.color]}`}>
                {section.category}
              </div>
              {section.endpoints.map((ep) => {
                const isActive = selected.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => selectEndpoint(ep)}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2 text-xs transition-colors ${
                      isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                  >
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold border ${METHOD_STYLE[ep.method].badge}`}>
                      {ep.method}
                    </span>
                    <span className="truncate">{ep.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-800">
          <a
            href="/api/auth/login"
            className="block w-full text-center text-xs bg-blue-600 hover:bg-blue-500 text-white rounded px-3 py-2 font-medium transition-colors"
          >
            Login with Google
          </a>
          <a
            href="/api/auth/status"
            target="_blank"
            className="block w-full text-center text-xs text-gray-400 hover:text-gray-200 mt-2 transition-colors"
          >
            Check Auth Status ↗
          </a>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded text-xs font-bold border ${METHOD_STYLE[selected.method].badge}`}>
            {selected.method}
          </span>
          <code className="flex-1 text-sm text-gray-300 font-mono truncate">{previewUrl}</code>
          <button
            onClick={sendRequest}
            disabled={loading}
            className="shrink-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Request Panel */}
          <div className="w-1/2 border-r border-gray-800 flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-800 bg-gray-900">
              <p className="text-xs text-gray-400">{selected.desc}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

              {/* Path Param */}
              {selected.pathParam && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Path — <span className="text-yellow-400">{selected.pathParam}</span>
                  </label>
                  <input
                    type="text"
                    value={pathParam}
                    onChange={(e) => setPathParam(e.target.value)}
                    placeholder={`Enter ${selected.pathParam}`}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Query Params */}
              {selected.queryParams && selected.queryParams.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Query Parameters</label>
                  <div className="space-y-2">
                    {selected.queryParams.map((p) => (
                      <div key={p.key} className="flex items-center gap-2">
                        <span className="w-28 shrink-0 text-xs font-mono text-blue-400 text-right">{p.key}</span>
                        <span className="text-gray-600">=</span>
                        <input
                          type="text"
                          value={queryParams[p.key] ?? ''}
                          onChange={(e) => setQueryParams((prev) => ({ ...prev, [p.key]: e.target.value }))}
                          placeholder={p.placeholder}
                          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              {['POST', 'PATCH'].includes(selected.method) && (
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Request Body <span className="text-gray-500 font-normal">(JSON)</span>
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    placeholder="{}"
                    className="w-full flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* GET with no params info */}
              {selected.method === 'GET' && !selected.pathParam && !selected.queryParams && (
                <p className="text-xs text-gray-500 italic">No parameters required for this request.</p>
              )}

              {/* DELETE info */}
              {selected.method === 'DELETE' && !selected.pathParam && (
                <p className="text-xs text-gray-500 italic">No body required for DELETE requests.</p>
              )}
            </div>
          </div>

          {/* Response Panel */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Response</span>
              <div className="flex items-center gap-3">
                {elapsed !== null && (
                  <span className="text-xs text-gray-500">{elapsed}ms</span>
                )}
                {status !== null && (
                  <span className={`text-xs font-bold font-mono ${statusColor()}`}>
                    {status}
                  </span>
                )}
                {response && (
                  <button
                    onClick={() => navigator.clipboard.writeText(response)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-500">Waiting for response...</p>
                  </div>
                </div>
              )}
              {!loading && response === null && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-gray-600">Hit &quot;Send&quot; to see the response</p>
                </div>
              )}
              {!loading && response !== null && (
                <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                  {response}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

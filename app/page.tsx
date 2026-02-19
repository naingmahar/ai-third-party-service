export default function Home() {
  const apis = [
    {
      category: 'Authentication',
      endpoints: [
        { method: 'GET', path: '/api/auth/login', desc: 'Redirect to Google OAuth consent screen' },
        { method: 'GET', path: '/api/auth/callback', desc: 'OAuth callback - exchanges code for tokens' },
        { method: 'GET', path: '/api/auth/status', desc: 'Check authentication status & user info' },
        { method: 'POST', path: '/api/auth/logout', desc: 'Revoke tokens and logout' },
      ],
    },
    {
      category: 'Gmail',
      endpoints: [
        { method: 'GET', path: '/api/gmail?maxResults=10', desc: 'List inbox emails' },
        { method: 'GET', path: '/api/gmail?q=is:unread', desc: 'Search emails (Gmail query syntax)' },
        { method: 'GET', path: '/api/gmail?profile=true', desc: 'Get Gmail profile info' },
        { method: 'GET', path: '/api/gmail/[id]', desc: 'Get single email by ID' },
        { method: 'GET', path: '/api/gmail/[id]?type=thread', desc: 'Get full email thread' },
        { method: 'POST', path: '/api/gmail', desc: 'Send email { to, subject, body, isHtml? }' },
        { method: 'PATCH', path: '/api/gmail/[id]', desc: 'Update email { action: "markRead" }' },
      ],
    },
    {
      category: 'Google Calendar',
      endpoints: [
        { method: 'GET', path: '/api/calendar', desc: 'List upcoming events' },
        { method: 'GET', path: '/api/calendar?view=today', desc: "Get today's events" },
        { method: 'GET', path: '/api/calendar?view=calendars', desc: 'List all calendars' },
        { method: 'GET', path: '/api/calendar/[id]', desc: 'Get event by ID' },
        { method: 'POST', path: '/api/calendar', desc: 'Create event { summary, startDateTime, endDateTime }' },
        { method: 'PATCH', path: '/api/calendar/[id]', desc: 'Update event' },
        { method: 'DELETE', path: '/api/calendar/[id]', desc: 'Delete event' },
      ],
    },
    {
      category: 'GA4 Analytics',
      endpoints: [
        { method: 'GET', path: '/api/ga4?report=overview', desc: 'Traffic overview (sessions, users, pageviews)' },
        { method: 'GET', path: '/api/ga4?report=pages', desc: 'Top pages by views' },
        { method: 'GET', path: '/api/ga4?report=countries', desc: 'Traffic by country' },
        { method: 'GET', path: '/api/ga4?report=devices', desc: 'Traffic by device category' },
        { method: 'GET', path: '/api/ga4?report=realtime', desc: 'Current active users (realtime)' },
        { method: 'GET', path: '/api/ga4?report=sources', desc: 'Top traffic sources' },
        { method: 'POST', path: '/api/ga4', desc: 'Custom report { startDate, endDate, metrics, dimensions? }' },
      ],
    },
  ];

  const methodColor: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-green-100 text-green-700',
    PATCH: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700',
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Third-Party Service</h1>
          <p className="mt-2 text-gray-600">
            REST API service for Google OAuth, Gmail, Calendar, and GA4 Analytics.
          </p>
          <div className="mt-4 flex gap-3">
            <div className="flex-1 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">
                Getting Started: Visit{' '}
                <a href="/api/auth/login" className="underline font-bold">
                  /api/auth/login
                </a>{' '}
                to authenticate with Google, then use the endpoints below.
              </p>
            </div>
            <a
              href="/playground"
              className="shrink-0 flex items-center gap-2 px-5 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <span>▶</span> Open Playground
            </a>
          </div>
        </div>

        <div className="grid gap-6">
          {apis.map((section) => (
            <div key={section.category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">{section.category}</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {section.endpoints.map((ep, i) => (
                  <div key={i} className="px-6 py-3 flex items-start gap-3">
                    <span className={`mt-0.5 px-2 py-0.5 text-xs font-mono font-bold rounded ${methodColor[ep.method]}`}>
                      {ep.method}
                    </span>
                    <div>
                      <code className="text-sm font-mono text-gray-800">{ep.path}</code>
                      <p className="text-xs text-gray-500 mt-0.5">{ep.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          Configure credentials in <code className="text-xs">.env.local</code>
        </p>
      </div>
    </main>
  );
}

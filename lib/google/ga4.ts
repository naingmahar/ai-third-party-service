import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';
import { getAuthenticatedClient } from './oauth';
import { GA4ReportParams, GA4ReportResponse } from '@/types/google';

/**
 * Get GA4 client using OAuth user tokens (Data API v1)
 * Note: GA4 Data API requires either a service account OR OAuth with
 * 'https://www.googleapis.com/auth/analytics.readonly' scope
 */
async function getGA4Client(): Promise<BetaAnalyticsDataClient> {
  const auth = await getAuthenticatedClient();
  const accessToken = auth.credentials.access_token;

  const googleAuth = new GoogleAuth({
    authClient: {
      getAccessToken: async () => ({ token: accessToken }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });

  return new BetaAnalyticsDataClient({ auth: googleAuth });
}

/**
 * Run a GA4 report
 */
export async function runReport(params: GA4ReportParams): Promise<GA4ReportResponse> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID environment variable is not set');
  }

  const analyticsClient = await getGA4Client();

  const [response] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
    metrics: params.metrics.map((name) => ({ name })),
    dimensions: params.dimensions?.map((name) => ({ name })),
    limit: params.limit || 100,
    orderBys: params.orderBy?.map((o) => ({
      metric: { metricName: o.fieldName },
      desc: o.descending ?? true,
    })),
  });

  return {
    dimensionHeaders: (response.dimensionHeaders || []).map((h) => ({ name: h.name || '' })),
    metricHeaders: (response.metricHeaders || []).map((h) => ({
      name: h.name || '',
      type: String(h.type ?? ''),
    })),
    rows: (response.rows || []).map((row) => ({
      dimensionValues: (row.dimensionValues || []).map((d) => ({ value: d.value || '' })),
      metricValues: (row.metricValues || []).map((m) => ({ value: m.value || '' })),
    })),
    rowCount: response.rowCount || 0,
  };
}

/**
 * Get common website traffic metrics for a date range
 */
export async function getTrafficOverview(startDate = '7daysAgo', endDate = 'today'): Promise<GA4ReportResponse> {
  return runReport({
    startDate,
    endDate,
    metrics: ['sessions', 'activeUsers', 'newUsers', 'screenPageViews', 'bounceRate', 'averageSessionDuration'],
    dimensions: ['date'],
    orderBy: [{ fieldName: 'date', descending: false }],
  });
}

/**
 * Get top pages by views
 */
export async function getTopPages(
  startDate = '7daysAgo',
  endDate = 'today',
  limit = 10
): Promise<GA4ReportResponse> {
  return runReport({
    startDate,
    endDate,
    metrics: ['screenPageViews', 'activeUsers', 'averageSessionDuration'],
    dimensions: ['pagePath', 'pageTitle'],
    limit,
    orderBy: [{ fieldName: 'screenPageViews', descending: true }],
  });
}

/**
 * Get traffic by country
 */
export async function getTrafficByCountry(
  startDate = '7daysAgo',
  endDate = 'today',
  limit = 20
): Promise<GA4ReportResponse> {
  return runReport({
    startDate,
    endDate,
    metrics: ['sessions', 'activeUsers'],
    dimensions: ['country'],
    limit,
    orderBy: [{ fieldName: 'sessions', descending: true }],
  });
}

/**
 * Get traffic by device category
 */
export async function getTrafficByDevice(
  startDate = '7daysAgo',
  endDate = 'today'
): Promise<GA4ReportResponse> {
  return runReport({
    startDate,
    endDate,
    metrics: ['sessions', 'activeUsers', 'screenPageViews'],
    dimensions: ['deviceCategory'],
    orderBy: [{ fieldName: 'sessions', descending: true }],
  });
}

/**
 * Get real-time active users (uses Realtime API)
 */
export async function getRealtimeUsers(): Promise<{ activeUsers: number }> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID environment variable is not set');
  }

  const analyticsClient = await getGA4Client();

  const [response] = await analyticsClient.runRealtimeReport({
    property: `properties/${propertyId}`,
    metrics: [{ name: 'activeUsers' }],
  });

  const activeUsers = Number(response.rows?.[0]?.metricValues?.[0]?.value || 0);
  return { activeUsers };
}

/**
 * Get top traffic sources
 */
export async function getTrafficSources(
  startDate = '7daysAgo',
  endDate = 'today',
  limit = 10
): Promise<GA4ReportResponse> {
  return runReport({
    startDate,
    endDate,
    metrics: ['sessions', 'activeUsers'],
    dimensions: ['sessionSource', 'sessionMedium'],
    limit,
    orderBy: [{ fieldName: 'sessions', descending: true }],
  });
}

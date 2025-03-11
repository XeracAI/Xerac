import { type NextRequest } from 'next/server';
import { UAParser } from 'ua-parser-js';

/**
 * Extracts user information from the request for use in analytics
 * Returns an object with useful properties for analytics tracking
 */
export function extractUserInfoForAnalytics(req: NextRequest) {
  // Get user agent info
  const userAgent = req.headers.get('user-agent') || '';

  // Use ua-parser-js to get detailed user agent information
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Extract browser info
  const browserInfo = result.browser.name || 'Unknown';

  // Extract OS info
  const osInfo = result.os.name || 'Unknown';

  // Check if device is mobile
  const deviceInfo = result.device.type === 'mobile' || result.device.type === 'tablet' ? 'mobile' : 'desktop';

  // Get IP address
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '';

  // Get referrer if available
  const referrer = req.headers.get('referer') || '';

  return {
    deviceInfo,
    browserInfo,
    osInfo,
    ipAddress: ip,
    referrer,
    userAgent,
  };
}

/**
 * Helper function to get user analytics data from headers
 * Use this in API routes to retrieve analytics data set by middleware
 */
export function getUserAnalyticsFromHeaders(headers: Headers) {
  return {
    deviceInfo: headers.get('x-analytics-deviceInfo') || undefined,
    browserInfo: headers.get('x-analytics-browserInfo') || undefined,
    osInfo: headers.get('x-analytics-osInfo') || undefined,
    ipAddress: headers.get('x-analytics-ipAddress') || undefined,
    referrer: headers.get('x-analytics-referrer') || undefined,
  };
}

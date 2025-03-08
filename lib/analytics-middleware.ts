import { type NextRequest } from 'next/server';

/**
 * Extracts user information from the request for use in analytics
 * Returns an object with useful properties for analytics tracking
 */
export function extractUserInfoForAnalytics(req: NextRequest) {
  // Get user agent info
  const userAgent = req.headers.get('user-agent') || '';

  // We need to parse user agent manually without the ua-parser-js library
  // Simple extraction of major browser and OS information
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());

  // Very basic browser detection
  let browserInfo = 'Unknown';
  if (userAgent.includes('Firefox')) browserInfo = 'Firefox';
  else if (userAgent.includes('Chrome')) browserInfo = 'Chrome';
  else if (userAgent.includes('Safari')) browserInfo = 'Safari';
  else if (userAgent.includes('Edge')) browserInfo = 'Edge';
  else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) browserInfo = 'IE';

  // Very basic OS detection
  let osInfo = 'Unknown';
  if (userAgent.includes('Windows')) osInfo = 'Windows';
  else if (userAgent.includes('Mac OS')) osInfo = 'macOS';
  else if (userAgent.includes('Linux')) osInfo = 'Linux';
  else if (userAgent.includes('Android')) osInfo = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) osInfo = 'iOS';

  const deviceInfo = isMobile ? 'mobile' : 'desktop';

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

import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { authConfig } from '@/app/(auth)/auth.config';
import { extractUserInfoForAnalytics } from '@/lib/analytics-middleware';

export default NextAuth(authConfig).auth((req: NextRequest) => {
  // Extract analytics data and add it to headers for server components
  const userInfo = extractUserInfoForAnalytics(req);
  const headers = new Headers(req.headers);

  // Add analytics data as headers
  Object.entries(userInfo).forEach(([key, value]) => {
    if (value) {
      headers.set(`x-analytics-${key}`, value.toString());
    }
  });

  return NextResponse.next({
    request: {
      // New request headers
      headers,
    },
  });
});

export const config = {
  matcher: ['/chat', '/chat/:id', '/api/:path*', '/login'],
};

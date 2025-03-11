'use server';

import { signOut } from './auth';
import { trackUserEvent } from '@/lib/analytics';
import { headers } from 'next/headers';
import { getUserAnalyticsFromHeaders } from '@/lib/analytics/middleware';

/**
 * Server action to track sign out event and then sign the user out
 * This ensures analytics are recorded server-side where we have direct
 * database access
 */
export async function trackSignOutAndSignOut(
  userId: string, 
  redirectPath: string = '/chat'
) {
  try {
    // Get analytics data from headers
    const headersList = await headers();
    const analyticsData = getUserAnalyticsFromHeaders(headersList);

    // Track sign out event using passed client info
    await trackUserEvent({
      userId,
      eventType: 'login', // Reusing login event type with success=false to indicate logout
      success: false,
      deviceInfo: analyticsData.deviceInfo,
      osInfo: analyticsData.osInfo,
      browserInfo: analyticsData.browserInfo,
      ipAddress: analyticsData.ipAddress,
      properties: {
        action: 'sign_out',
        redirectPath
      }
    });

    // Now sign the user out
    return await signOut({ redirectTo: redirectPath });
  } catch (error) {
    // Log error but still sign out
    console.error('Failed to track sign out event:', error);
    return await signOut({ redirectTo: redirectPath });
  }
} 
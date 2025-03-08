# User Event Tracking

This document outlines how user events are tracked throughout the Xerac application.

## Implementation

User events are tracked using the Clickhouse analytics system and stored in the `user_events` table. The `trackUserEvent` function from `lib/analytics.ts` is used to track these events.

### Event Types

The following user event types are tracked:

- `signup` - When a user creates a new account
- `login` - When a user logs into their account (with success=true) or logs out (with success=false)
- `profile_update` - When a user updates their profile information
- `password_change` - When a user changes their password
- `otp_request` - When a user requests a one-time password
- `referral_created` - When a user refers another user
- `referral_used` - When a user uses a referral code during signup

### Implemented Tracking

We've implemented tracking in the following places:

1. **Authentication Flow** (`app/(auth)/actions.ts`)
   - Signup - When a new user account is created
   - Login - When a user successfully logs in
   - OTP Request - When a user requests an OTP for verification
   - Password Change - When a user sets or changes their password
   - Profile Update - When a user updates their profile information
   - Referral Created/Used - When referral codes are used

2. **Sign Out Flow** (`app/(auth)/signout-action.ts` and `components/sidebar-user-nav.tsx`)
   - Logout - When a user signs out (using login event with success=false)
   - Uses a server action to ensure Clickhouse connection is available
   - Automatically captures user agent/device information from request headers

3. **Analytics Support** (`lib/analytics-middleware.ts` and `middleware.ts`)
   - Middleware captures user information from requests and injects into headers
   - Helper functions to extract and format user agent and device information from headers

### Server-Side Tracking Architecture

All analytics tracking is performed server-side where we have direct access to the Clickhouse database:

1. **Middleware Layer** 
   - The Next.js middleware captures user agent, device, and IP information
   - This information is injected into request headers with `x-analytics-` prefixed keys
   - No client-side code is needed to collect or pass this information

2. **Server Actions & API Routes**
   - All analytics tracking happens in server components/actions
   - Server code extracts analytics data from request headers using `headers()` and `getUserAnalyticsFromHeaders()`
   - No manual passing of browser/device information is required

3. **Client Components**
   - Client components simply call server actions
   - They don't need to collect or pass any analytics information themselves

### Device and Browser Information

All user agent and device information is collected automatically on the server side:

- The middleware extracts information from incoming requests
- This information is made available to server components via request headers
- No client-side collection of device/browser information is needed
- This provides consistent data collection across the entire application

## Additional Tracking Opportunities

Consider implementing user event tracking in these additional places:

1. **Profile Settings Page**
   - When a user updates their email, avatar, or other profile settings

2. **Account Security**
   - When a user enables/disables two-factor authentication
   - When a user's account is locked due to failed login attempts

3. **Subscription/Payment**
   - When a user upgrades/downgrades their subscription
   - When a user makes a payment

4. **Privacy Settings**
   - When a user updates privacy or notification preferences

## Best Practices

When implementing user event tracking:

1. **Server-Side Tracking**
   - All tracking is done server-side where database connections are available
   - Use the `headers()` API and `getUserAnalyticsFromHeaders()` helper to get analytics data
   - No need to pass analytics data from client to server

2. **User Privacy**
   - Only track necessary information
   - Follow data privacy regulations (GDPR, CCPA, etc.)
   - Allow users to opt-out of analytics tracking if required

3. **Error Handling**
   - Wrap analytics calls in try/catch blocks to prevent tracking issues from affecting core functionality
   - Log analytics errors for debugging without exposing them to users

4. **Performance**
   - Consider using batched event tracking for high-volume events
   - Use non-blocking approaches for analytics calls when appropriate

5. **Data Quality**
   - Validate event data when possible
   - Use consistent event naming and property formats
   - Document new event types and properties for team reference

## Querying User Events

To query user events data in Clickhouse, you can use SQL like:

```sql
-- Daily user signups
SELECT
    toDate(event_date) AS date,
    count() AS signup_count
FROM user_events
WHERE event_type = 'signup'
GROUP BY date
ORDER BY date DESC
LIMIT 30;

-- Login success rate
SELECT
    toDate(event_date) AS date,
    countIf(success = true) AS successful_logins,
    countIf(success = false AND JSONExtractString(properties, 'action') != 'sign_out') AS failed_logins,
    countIf(success = false AND JSONExtractString(properties, 'action') = 'sign_out') AS logouts
FROM user_events
WHERE event_type = 'login'
  AND event_date >= today() - 30
GROUP BY date
ORDER BY date DESC;

-- User retention
SELECT
    count(DISTINCT CASE WHEN event_type = 'signup' THEN user_id END) AS signups,
    count(DISTINCT CASE WHEN event_type = 'login' AND success = true AND event_date >= addDays(today(), -7) THEN user_id END) AS weekly_active
FROM user_events
WHERE event_date >= addDays(today(), -30);
```

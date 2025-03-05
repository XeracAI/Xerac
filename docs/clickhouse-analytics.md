# Clickhouse Analytics System

This document explains how to use the Clickhouse analytics system in the Xerac application.

## Overview

The Xerac application uses Clickhouse as an analytics database to track user behavior, application performance, and other metrics. Clickhouse is a column-oriented database management system that is optimized for analytical workloads, making it ideal for storing and querying large volumes of event data.

## Schema Structure

The Clickhouse schema consists of several tables designed to track different types of events:

1. **user_events** - Tracks user-related events like signups, logins, and profile updates
2. **chat_events** - Tracks chat session metrics and message analytics
3. **document_events** - Tracks document operations and interactions
4. **file_events** - Tracks file uploads, processing, and usage
5. **error_events** - Tracks application errors for debugging and monitoring
6. **performance_metrics** - Tracks API and processing performance
7. **session_events** - Tracks user sessions for engagement metrics

Additionally, there are materialized views that pre-aggregate data for common analytics queries:

1. **user_metrics_daily** - Daily aggregation of user metrics
2. **message_metrics_daily** - Daily aggregation of message metrics

## Environment Configuration

To use Clickhouse, you need to configure the following environment variables:

```
CLICKHOUSE_ENABLED=true
CLICKHOUSE_HOSTS=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_TIMEOUT=100000
```

## Tracking Events

The `lib/analytics.ts` file provides helper functions for tracking different types of events. Here are some examples of how to use them:

### Tracking User Events

```typescript
import { trackUserEvent } from 'lib/analytics';

// Track a user signup
await trackUserEvent({
  userId: user.id,
  eventType: 'signup',
  deviceInfo: req.headers['user-agent'],
  ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  country: 'US', // You might get this from an IP geolocation service
  properties: {
    referralSource: 'direct',
    userType: 'free'
  }
});
```

### Tracking Chat Events

```typescript
import { trackChatEvent } from 'lib/analytics';

// Track a message sent by a user
await trackChatEvent({
  chatId: chat.id,
  userId: user.id,
  messageId: message._id.toString(),
  eventType: 'message_sent',
  messageRole: 'user',
  messageLength: message.content?.length || 0,
  hasImages: message.images && message.images.length > 0,
  hasOtherMedia: !!(message.audios?.length || message.videos?.length || message.voice),
  properties: {
    contentType: typeof message.content === 'string' ? 'text' : 'structured'
  }
});

// Track a response from the assistant
await trackChatEvent({
  chatId: chat.id,
  userId: user.id,
  messageId: response._id.toString(),
  eventType: 'message_received',
  messageRole: 'assistant',
  modelId: response.modelId,
  tokenCount: tokenCount,
  messageLength: response.content?.length || 0,
  responseTimeMs: responseTime,
  properties: {
    promptTokens: promptTokens,
    completionTokens: completionTokens
  }
});
```

### Tracking Document Events

```typescript
import { trackDocumentEvent } from 'lib/analytics';

// Track document creation
await trackDocumentEvent({
  documentId: document.id,
  userId: user.id,
  eventType: 'document_created',
  documentKind: document.kind,
  contentLength: document.content?.length || 0,
  sessionId: sessionId,
  properties: {
    title: document.title
  }
});
```

### Tracking File Events

```typescript
import { trackFileEvent } from 'lib/analytics';

// Track file upload
await trackFileEvent({
  fileId: file._id.toString(),
  userId: file.user,
  eventType: 'file_uploaded',
  fileType: file.type,
  fileSize: file.size,
  properties: {
    fileName: file.fileName
  }
});

// Track file processing completion
await trackFileEvent({
  fileId: file._id.toString(),
  userId: file.user,
  eventType: 'file_processed',
  fileType: file.type,
  fileSize: file.size,
  processingTimeMs: processingTime,
  isProcessed: true,
  gptTokenCount: file.GPTTokenCount,
  properties: {
    pageCount: file.pageCount
  }
});
```

### Tracking Errors

```typescript
import { trackErrorEvent } from 'lib/analytics';

// Track an API error
try {
  // API call
} catch (error) {
  await trackErrorEvent({
    userId: user?.id,
    errorCode: error.code || 'UNKNOWN',
    errorMessage: error.message,
    errorType: 'api',
    component: 'chat-api',
    requestPath: req.path,
    requestMethod: req.method,
    stackTrace: error.stack,
    properties: {
      requestId: req.id
    }
  });
  
  throw error; // Re-throw the error
}
```

### Tracking Performance

```typescript
import { trackPerformanceMetric } from 'lib/analytics';

// Track API performance
const startTime = performance.now();
try {
  // API call
} finally {
  const responseTime = performance.now() - startTime;
  await trackPerformanceMetric({
    endpoint: req.path,
    method: req.method,
    statusCode: res.statusCode,
    responseTimeMs: responseTime,
    userId: user?.id,
    sessionId: req.session?.id,
    isAuthenticated: !!user
  });
}
```

### Tracking Sessions

```typescript
import { trackSessionEvent } from 'lib/analytics';

// Track session start
await trackSessionEvent({
  sessionId: sessionId,
  userId: user.id,
  eventType: 'session_start',
  deviceType: isMobile ? 'mobile' : 'desktop',
  referrer: req.headers.referer,
  properties: {
    browser: browserInfo,
    os: osInfo
  }
});

// Track page view
await trackSessionEvent({
  sessionId: sessionId,
  userId: user.id,
  eventType: 'page_view',
  pagePath: req.path,
  properties: {
    query: req.query
  }
});

// Track feature usage
await trackSessionEvent({
  sessionId: sessionId,
  userId: user.id,
  eventType: 'feature_used',
  featureName: 'document-sharing',
  properties: {
    documentId: document.id
  }
});
```

## Querying Analytics Data

You can query the Clickhouse database directly using SQL. Here are some example queries:

### User Signups by Day

```sql
SELECT
    toDate(event_date) AS date,
    count() AS signup_count
FROM user_events
WHERE event_type = 'signup'
GROUP BY date
ORDER BY date DESC
LIMIT 30;
```

### Message Count by Model

```sql
SELECT
    model_id,
    count() AS message_count,
    avg(response_time_ms) AS avg_response_time,
    sum(token_count) AS total_tokens
FROM chat_events
WHERE event_type = 'message_received'
  AND event_date >= today() - 30
GROUP BY model_id
ORDER BY message_count DESC;
```

### Error Rate by Component

```sql
SELECT
    component,
    count() AS error_count,
    uniqExact(user_id) AS affected_users
FROM error_events
WHERE event_date >= today() - 7
GROUP BY component
ORDER BY error_count DESC;
```

### Active Users by Day

```sql
SELECT
    toDate(event_date) AS date,
    uniqExact(user_id) AS active_users
FROM session_events
WHERE event_type = 'session_start'
  AND event_date >= today() - 30
GROUP BY date
ORDER BY date DESC;
```

## Maintenance

Clickhouse tables are partitioned by month using the `toYYYYMM(event_date)` function. This allows for efficient querying of recent data and makes it easy to drop old partitions when they are no longer needed.

To drop old partitions, you can use the following SQL:

```sql
ALTER TABLE user_events DROP PARTITION '202301';
```

This will drop the partition for January 2023.

## Troubleshooting

If you're having issues with the Clickhouse analytics system, check the following:

1. Make sure the `CLICKHOUSE_ENABLED` environment variable is set to `true`
2. Check that the Clickhouse server is running and accessible
3. Verify that the `CLICKHOUSE_HOSTS` environment variable is set correctly
4. Check the application logs for any Clickhouse-related errors

If you're still having issues, you can try connecting to the Clickhouse server directly using the Clickhouse client:

```bash
clickhouse-client --host=localhost --port=9000 --user=default
``` 
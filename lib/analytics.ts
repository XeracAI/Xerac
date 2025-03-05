import { Readable } from 'stream';
import { insert } from './clickhouse';
import type { InsertResult } from '@clickhouse/client';

// Types for analytics events
export type UserEventType = 
  | 'signup'
  | 'login'
  | 'profile_update'
  | 'password_change'
  | 'otp_request'
  | 'referral_created'
  | 'referral_used';

export type ChatEventType = 
  | 'chat_created'
  | 'message_sent'
  | 'message_received'
  | 'message_voted';

export type DocumentEventType = 
  | 'document_created'
  | 'document_viewed'
  | 'document_edited'
  | 'document_shared'
  | 'document_deleted';

export type FileEventType = 
  | 'file_uploaded'
  | 'file_processed'
  | 'file_viewed'
  | 'file_downloaded'
  | 'file_deleted';

export type SessionEventType = 
  | 'session_start'
  | 'session_end'
  | 'page_view'
  | 'feature_used';

export type ErrorType = 
  | 'api'
  | 'database'
  | 'auth'
  | 'processing'
  | 'other';

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type DocumentKind = 'text' | 'code' | 'image' | 'sheet';

// Define a type for JSON-serializable values
export type JsonValue = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

// Helper functions for tracking analytics events

/**
 * Track a user-related event
 */
export async function trackUserEvent(params: {
  userId: string;
  eventType: UserEventType;
  deviceInfo?: string;
  osInfo?: string;
  browserInfo?: string;
  ipAddress?: string;
  country?: string;
  properties?: Record<string, JsonValue>;
  success?: boolean;
}): Promise<InsertResult | null> {
  const { userId, eventType, deviceInfo, osInfo, browserInfo, ipAddress, country, properties, success } = params;

  const values = {
    user_id: userId,
    event_type: eventType,
    device_info: deviceInfo || '',
    os_info: osInfo || '',
    browser_info: browserInfo || '',
    ip_address: ipAddress || '',
    country: country || '',
    properties: properties ? JSON.stringify(properties) : '',
    success: success !== undefined ? success : true
  };

  const stream = Readable.from([values]);

  return insert({
    table: 'user_events',
    values: stream,
    format: 'JSONEachRow'
  });
}

/**
 * Track a chat-related event
 */
export async function trackChatEvent(params: {
  chatId: string;
  userId: string;
  messageId?: string;
  eventType: ChatEventType;
  messageRole?: MessageRole;
  modelId?: string;
  tokenCount?: number;
  messageLength?: number;
  responseTimeMs?: number;
  hasImages?: boolean;
  hasOtherMedia?: boolean;
  properties?: Record<string, JsonValue>;
}): Promise<InsertResult | null> {
  const { 
    chatId, 
    userId, 
    messageId, 
    eventType, 
    messageRole, 
    modelId, 
    tokenCount, 
    messageLength, 
    responseTimeMs,
    hasImages,
    hasOtherMedia,
    properties 
  } = params;

  const values = {
    chat_id: chatId,
    user_id: userId,
    message_id: messageId || '',
    event_type: eventType,
    message_role: messageRole || 'user',
    model_id: modelId || '',
    token_count: tokenCount || 0,
    message_length: messageLength || 0,
    response_time_ms: responseTimeMs || 0,
    has_images: hasImages ? 1 : 0,
    has_other_media: hasOtherMedia ? 1 : 0,
    properties: properties ? JSON.stringify(properties) : ''
  };

  const stream = Readable.from([values]);

  return insert({
    table: 'chat_events',
    values: stream,
    format: 'JSONEachRow'
  });
}

/**
 * Track a document-related event
 */
export async function trackDocumentEvent(params: {
  documentId: string;
  userId: string;
  eventType: DocumentEventType;
  documentKind: DocumentKind;
  contentLength?: number;
  sessionId?: string;
  properties?: Record<string, JsonValue>;
}): Promise<InsertResult | null> {
  const { documentId, userId, eventType, documentKind, contentLength, sessionId, properties } = params;

  const values = {
    document_id: documentId,
    user_id: userId,
    event_type: eventType,
    document_kind: documentKind,
    content_length: contentLength || 0,
    session_id: sessionId || '',
    properties: properties ? JSON.stringify(properties) : ''
  };

  const stream = Readable.from([values]);

  return insert({
    table: 'document_events',
    values: stream,
    format: 'JSONEachRow'
  });
}

/**
 * Track a file-related event
 */
export async function trackFileEvent(params: {
  fileId: string;
  userId: string;
  eventType: FileEventType;
  fileType: string;
  fileSize: number;
  processingTimeMs?: number;
  isProcessed?: boolean;
  gptTokenCount?: number;
  properties?: Record<string, JsonValue>;
}): Promise<InsertResult | null> {
  const { 
    fileId, 
    userId, 
    eventType, 
    fileType, 
    fileSize, 
    processingTimeMs, 
    isProcessed, 
    gptTokenCount, 
    properties 
  } = params;

  const values = {
    file_id: fileId,
    user_id: userId,
    event_type: eventType,
    file_type: fileType,
    file_size: fileSize,
    processing_time_ms: processingTimeMs || 0,
    is_processed: isProcessed ? 1 : 0,
    gpt_token_count: gptTokenCount || 0,
    properties: properties ? JSON.stringify(properties) : ''
  };

  const stream = Readable.from([values]);

  return insert({
    table: 'file_events',
    values: stream,
    format: 'JSONEachRow'
  });
}

/**
 * Track an error event
 */
export async function trackErrorEvent(params: {
  userId?: string;
  errorCode: string;
  errorMessage: string;
  errorType: ErrorType;
  component: string;
  requestPath?: string;
  requestMethod?: string;
  stackTrace?: string;
  properties?: Record<string, JsonValue>;
}): Promise<InsertResult | null> {
  const { 
    userId, 
    errorCode, 
    errorMessage, 
    errorType, 
    component, 
    requestPath, 
    requestMethod, 
    stackTrace, 
    properties 
  } = params;

  const values = {
    user_id: userId || '00000000-0000-0000-0000-000000000000',
    error_code: errorCode,
    error_message: errorMessage,
    error_type: errorType,
    component: component,
    request_path: requestPath || '',
    request_method: requestMethod || '',
    stack_trace: stackTrace || '',
    properties: properties ? JSON.stringify(properties) : ''
  };

  const stream = Readable.from([values]);

  return insert({
    table: 'error_events',
    values: stream,
    format: 'JSONEachRow'
  });
}

/**
 * Track API performance metrics
 */
export async function trackPerformanceMetric(params: {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  userId?: string;
  sessionId?: string;
  isAuthenticated?: boolean;
}): Promise<InsertResult | null> {
  const { endpoint, method, statusCode, responseTimeMs, userId, sessionId, isAuthenticated } = params;

  const values = {
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    user_id: userId || '00000000-0000-0000-0000-000000000000',
    session_id: sessionId || '',
    is_authenticated: isAuthenticated ? 1 : 0
  };

  const stream = Readable.from([values]);

  return insert({
    table: 'performance_metrics',
    values: stream,
    format: 'JSONEachRow'
  });
}

/**
 * Track session events
 */
export async function trackSessionEvent(params: {
  sessionId: string;
  userId: string;
  eventType: SessionEventType;
  pagePath?: string;
  featureName?: string;
  durationSeconds?: number;
  deviceType?: string;
  referrer?: string;
  properties?: Record<string, JsonValue>;
}): Promise<InsertResult | null> {
  const { 
    sessionId, 
    userId, 
    eventType, 
    pagePath, 
    featureName, 
    durationSeconds, 
    deviceType, 
    referrer, 
    properties 
  } = params;

  const values = {
    session_id: sessionId,
    user_id: userId,
    event_type: eventType,
    page_path: pagePath || '',
    feature_name: featureName || '',
    duration_seconds: durationSeconds || 0,
    device_type: deviceType || '',
    referrer: referrer || '',
    properties: properties ? JSON.stringify(properties) : ''
  };

  const stream = Readable.from([values]);

  return insert({
    table: 'session_events',
    values: stream,
    format: 'JSONEachRow'
  });
}

-- Clickhouse Schema for Analytics
-- These are optimized for analytics workloads with appropriate data types and partitioning

-- User Events Table
-- Tracks user-related events like signups, logins, feature usage
CREATE TABLE IF NOT EXISTS user_events (
    event_date Date DEFAULT today(),
    event_time DateTime64(3) DEFAULT now64(3),
    user_id UUID,
    event_type Enum('signup', 'login', 'profile_update', 'password_change', 'otp_request', 'referral_created', 'referral_used'),
    device_info String,
    os_info String,
    browser_info String,
    ip_address String,
    country String,
    properties String, -- JSON string with additional event-specific properties
    success Boolean DEFAULT true
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, user_id, event_type);

-- Chat Analytics Table
-- Tracks chat session metrics and message analytics
CREATE TABLE IF NOT EXISTS chat_events (
    event_date Date DEFAULT today(),
    event_time DateTime64(3) DEFAULT now64(3),
    chat_id UUID,
    user_id UUID,
    message_id String, -- MongoDB ObjectID as string
    event_type Enum('chat_created', 'message_sent', 'message_received', 'message_voted'),
    message_role Enum('system', 'user', 'assistant', 'tool'),
    model_id String,
    token_count UInt32 DEFAULT 0,
    message_length UInt32 DEFAULT 0,
    response_time_ms UInt32 DEFAULT 0,
    has_images UInt8 DEFAULT 0,
    has_other_media UInt8 DEFAULT 0,
    properties String -- JSON string with additional properties
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, chat_id, event_time);

-- Document Analytics Table
-- Tracks document operations and interactions
CREATE TABLE IF NOT EXISTS document_events (
    event_date Date DEFAULT today(),
    event_time DateTime64(3) DEFAULT now64(3),
    document_id UUID,
    user_id UUID,
    event_type Enum('document_created', 'document_viewed', 'document_edited', 'document_shared', 'document_deleted'),
    document_kind Enum('text', 'code', 'image', 'sheet'),
    content_length UInt32 DEFAULT 0,
    session_id String,
    properties String -- JSON string with additional properties
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, document_id, event_time);

-- File Operations Analytics
-- Tracks file uploads, processing, and usage
CREATE TABLE IF NOT EXISTS file_events (
    event_date Date DEFAULT today(),
    event_time DateTime64(3) DEFAULT now64(3),
    file_id String, -- MongoDB ObjectID as string
    user_id UUID, 
    event_type Enum('file_uploaded', 'file_processed', 'file_viewed', 'file_downloaded', 'file_deleted'),
    file_type String,
    file_size UInt64,
    processing_time_ms UInt32 DEFAULT 0,
    is_processed UInt8 DEFAULT 0,
    gpt_token_count UInt32 DEFAULT 0,
    properties String -- JSON string with additional properties
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, user_id, event_time);

-- Error Events
-- Track application errors for debugging and monitoring
CREATE TABLE IF NOT EXISTS error_events (
    event_date Date DEFAULT today(),
    event_time DateTime64(3) DEFAULT now64(3),
    user_id UUID,
    error_code String,
    error_message String,
    error_type Enum('api', 'database', 'auth', 'processing', 'other'),
    component String,
    request_path String,
    request_method String,
    stack_trace String,
    properties String -- JSON string with additional properties
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, error_type, event_time);

-- Performance Metrics
-- Tracks API and processing performance
CREATE TABLE IF NOT EXISTS performance_metrics (
    event_date Date DEFAULT today(),
    event_time DateTime64(3) DEFAULT now64(3),
    endpoint String,
    method String,
    status_code UInt16,
    response_time_ms UInt32,
    user_id UUID,
    session_id String,
    is_authenticated UInt8 DEFAULT 0
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, endpoint, event_time);

-- Session Analytics
-- Tracks user sessions for engagement metrics
CREATE TABLE IF NOT EXISTS session_events (
    event_date Date DEFAULT today(),
    event_time DateTime64(3) DEFAULT now64(3),
    session_id String,
    user_id UUID,
    event_type Enum('session_start', 'session_end', 'page_view', 'feature_used'),
    page_path String,
    feature_name String,
    duration_seconds UInt32 DEFAULT 0,
    device_type String,
    referrer String,
    properties String -- JSON string with additional properties
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, user_id, session_id, event_time);

-- Aggregated User Metrics (daily rollup)
-- Pre-aggregated table for dashboards and reports
CREATE MATERIALIZED VIEW IF NOT EXISTS user_metrics_daily
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (date, user_id)
AS SELECT
    toDate(event_date) AS date,
    user_id,
    count() FILTER (WHERE event_type = 'login') AS login_count,
    count() FILTER (WHERE event_type = 'signup') AS signup_count,
    uniqExact(session_id) AS session_count
FROM session_events
GROUP BY date, user_id;

-- Aggregated Message Metrics (daily rollup)
CREATE MATERIALIZED VIEW IF NOT EXISTS message_metrics_daily
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (date, model_id)
AS SELECT
    toDate(event_date) AS date,
    model_id,
    count() FILTER (WHERE message_role = 'assistant') AS response_count,
    avg(response_time_ms) FILTER (WHERE message_role = 'assistant') AS avg_response_time,
    sum(token_count) AS total_tokens
FROM chat_events
GROUP BY date, model_id;

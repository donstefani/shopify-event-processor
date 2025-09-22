/**
 * Error Types for Shopify Event Processor
 * 
 * Type definitions for error handling, categorization, and notifications.
 * These types are used across the application for consistent error management.
 */

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  WEBHOOK_PROCESSING = 'webhook_processing',
  GRAPHQL_API = 'graphql_api',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

// Error context for better debugging
export interface ErrorContext {
  service?: string | undefined;
  operation?: string | undefined;
  shopDomain?: string | undefined;
  webhookTopic?: string | undefined;
  userId?: string | undefined;
  requestId?: string | undefined;
  additionalData?: Record<string, any> | undefined;
}

// Error notification configuration
export interface ErrorNotificationConfig {
  email: {
    enabled: boolean;
    from: string;
    to: string[];
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  severityThreshold: ErrorSeverity; // Only send emails for this severity and above
  rateLimit: {
    enabled: boolean;
    maxEmailsPerHour: number;
    maxEmailsPerDay: number;
  };
}

// Error tracking for rate limiting
export interface ErrorTracking {
  lastEmailSent: Map<string, number>;
  emailCounts: {
    hourly: Map<string, number>;
    daily: Map<string, number>;
  };
}

// Error handling service interface
export interface IErrorHandlingService {
  initialize(): Promise<void>;
  handleError(
    error: Error | unknown,
    severity?: ErrorSeverity,
    category?: ErrorCategory,
    context?: ErrorContext
  ): Promise<void>;
  handleCriticalError(error: Error | unknown, context?: ErrorContext): Promise<void>;
  handleWebhookError(
    error: Error | unknown,
    webhookTopic: string,
    shopDomain: string,
    context?: Partial<ErrorContext>
  ): Promise<void>;
  handleGraphQLError(
    error: Error | unknown,
    operation: string,
    shopDomain: string,
    context?: Partial<ErrorContext>
  ): Promise<void>;
}

// Throttling and Rate Limiting Types
export interface RateLimitInfo {
  requestedQueryCost: number;
  actualQueryCost: number;
  throttleStatus: ThrottleStatus;
}

export interface ThrottleStatus {
  maximumAvailable: number;
  currentlyAvailable: number;
  restoreRate: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface ThrottlingConfig {
  enabled: boolean;
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableStatusCodes: number[];
  respectShopifyRateLimits: boolean;
}

export interface ThrottlingContext {
  shopDomain: string;
  operation: string;
  requestId?: string;
  additionalData?: Record<string, any>;
}

export interface ThrottlingResult<T> {
  success: boolean;
  data?: T | undefined;
  error?: Error | undefined;
  rateLimitInfo?: RateLimitInfo | undefined;
  retryCount: number;
  totalDelay: number;
}

// Throttling service interface
export interface IThrottlingService {
  executeWithThrottling<T>(
    operation: () => Promise<T>,
    context: ThrottlingContext,
    config?: Partial<ThrottlingConfig>
  ): Promise<ThrottlingResult<T>>;
  
  parseRateLimitHeaders(headers: Record<string, string>): RateLimitInfo | null;
  
  calculateBackoffDelay(retryCount: number, config: ThrottlingConfig): number;
  
  shouldRetry(error: Error, retryCount: number, config: ThrottlingConfig): boolean;
}

import * as Sentry from '@sentry/react';

export const initSentry = () => {
  // Only initialize Sentry if DSN is provided
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  try {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      // Set tracing propagation targets
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/.*\.supabase\.co/,
      ],
      // Performance Monitoring
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 0,
      // Disable session replay in development to avoid errors
      replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 0,
      replaysOnErrorSampleRate: import.meta.env.MODE === 'production' ? 1.0 : 0,
      // Error filtering
      beforeSend(event) {
        // Filter out development errors and common browser errors
        if (import.meta.env.MODE === 'development') {
          return null;
        }
        // Filter out common non-actionable errors
        if (event.exception?.values?.[0]?.type === 'MessageNotSentError' ||
            event.exception?.values?.[0]?.type === 'RegisterClientLocalizationsError') {
          return null;
        }
        return event;
      },
      // Additional configuration
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      maxBreadcrumbs: 50,
      debug: false, // Disable debug to reduce console noise
    });
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error);
  }
};

// Error boundary component
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Performance monitoring helpers
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, () => {});
};

export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const addBreadcrumb = Sentry.addBreadcrumb;

// Custom performance monitoring
export const measurePerformance = <T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> => {
  return Sentry.startSpan({ name, op: 'function' }, () => {
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.catch((error) => {
          Sentry.captureException(error);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  });
};
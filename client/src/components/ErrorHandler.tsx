import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorInfo {
  type: 'network' | 'validation' | 'permission' | 'server' | 'unknown';
  message: string;
  code?: string | number;
  details?: string;
  retryable?: boolean;
}

interface ErrorHandlerProps {
  error: Error | ErrorInfo | string;
  onRetry?: () => void;
  onNavigateHome?: () => void;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onNavigateHome,
  showDetails = false,
  size = 'md'
}) => {
  const getErrorInfo = (error: Error | ErrorInfo | string): ErrorInfo => {
    if (typeof error === 'string') {
      return {
        type: 'unknown',
        message: error,
        retryable: true
      };
    }

    if (error instanceof Error) {
      // Parse common error patterns
      if (error.message.includes('fetch')) {
        return {
          type: 'network',
          message: 'Unable to connect to server. Please check your internet connection.',
          details: error.message,
          retryable: true
        };
      }
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return {
          type: 'permission',
          message: 'You are not authorized to access this resource. Please log in again.',
          details: error.message,
          retryable: false
        };
      }
      
      if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        return {
          type: 'server',
          message: 'Server error occurred. Our team has been notified.',
          details: error.message,
          retryable: true
        };
      }
      
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return {
          type: 'validation',
          message: 'Invalid data provided. Please check your input and try again.',
          details: error.message,
          retryable: false
        };
      }

      return {
        type: 'unknown',
        message: error.message || 'An unexpected error occurred.',
        details: error.stack,
        retryable: true
      };
    }

    return error as ErrorInfo;
  };

  const errorInfo = getErrorInfo(error);

  const getIconColor = () => {
    switch (errorInfo.type) {
      case 'network':
        return 'text-orange-600';
      case 'permission':
        return 'text-red-600';
      case 'validation':
        return 'text-yellow-600';
      case 'server':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-6 w-6';
      case 'lg': return 'h-16 w-16';
      default: return 'h-12 w-12';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return { title: 'text-lg', message: 'text-sm', details: 'text-xs' };
      case 'lg': return { title: 'text-3xl', message: 'text-lg', details: 'text-sm' };
      default: return { title: 'text-2xl', message: 'text-base', details: 'text-sm' };
    }
  };

  const textSizes = getTextSize();

  return (
    <div className={`flex flex-col items-center justify-center text-center ${size === 'lg' ? 'py-16' : 'py-8'}`}>
      <div className={`${getIconColor()} mb-4`}>
        <AlertTriangle className={getIconSize()} />
      </div>
      
      <h3 className={`font-semibold text-gray-900 mb-2 ${textSizes.title}`}>
        {errorInfo.type === 'network' && 'Connection Error'}
        {errorInfo.type === 'permission' && 'Access Denied'}
        {errorInfo.type === 'validation' && 'Invalid Data'}
        {errorInfo.type === 'server' && 'Server Error'}
        {errorInfo.type === 'unknown' && 'Something Went Wrong'}
      </h3>
      
      <p className={`text-gray-600 mb-4 max-w-md ${textSizes.message}`}>
        {errorInfo.message}
      </p>

      {showDetails && errorInfo.details && (
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center space-x-1">
            <Bug className="h-4 w-4" />
            <span>Technical Details</span>
          </summary>
          <div className={`mt-2 p-3 bg-gray-100 rounded-lg text-left font-mono ${textSizes.details} max-w-2xl overflow-auto`}>
            {errorInfo.details}
          </div>
        </details>
      )}

      <div className="flex space-x-3">
        {errorInfo.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        )}
        
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Utility function to create structured errors
export const createError = (
  type: ErrorInfo['type'],
  message: string,
  details?: string,
  code?: string | number
): ErrorInfo => ({
  type,
  message,
  details,
  code,
  retryable: type !== 'permission' && type !== 'validation'
});

// Hook for handling errors with context
export const useErrorHandler = () => {
  const handleError = (error: unknown, context?: string) => {
    console.error(`Error in ${context || 'application'}:`, error);
    
    if (error instanceof Error) {
      // Log to error reporting service in production
      if (process.env.NODE_ENV === 'production') {
        // Integration point for error reporting services
        console.log('Would send to error reporting service:', {
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  return { handleError };
};
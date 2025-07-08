import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface PlaidLinkProps {
  onSuccess: (accessToken: string, metadata: any) => void;
  onError?: (error: any) => void;
  className?: string;
  buttonText?: string;
  disabled?: boolean;
}

const PlaidLink: React.FC<PlaidLinkProps> = ({
  onSuccess,
  onError,
  className = '',
  buttonText = 'Link Bank Account',
  disabled = false
}) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch link token from backend
  const fetchLinkToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create link token');
      }

      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize bank linking';
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Initialize link token on component mount
  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  // Handle successful link
  const handleOnSuccess = useCallback(async (publicToken: string, metadata: any) => {
    try {
      setLoading(true);
      
      // Exchange public token for access token
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          public_token: publicToken,
          metadata: metadata
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange public token');
      }

      const data = await response.json();
      setSuccess(true);
      onSuccess(data.access_token, metadata);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link bank account';
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Handle link exit
  const handleOnExit = useCallback((err: any, metadata: any) => {
    if (err) {
      console.error('Plaid Link exited with error:', err);
      setError('Bank linking was cancelled or failed');
      onError?.(err);
    }
  }, [onError]);

  // Plaid Link hook
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
    onEvent: (eventName, metadata) => {
      console.log('Plaid Link event:', eventName, metadata);
    },
  });

  if (success) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Bank Account Connected</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
        <button
          onClick={fetchLinkToken}
          className="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading || disabled}
      className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
};

export default PlaidLink;
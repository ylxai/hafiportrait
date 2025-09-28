'use client';

import { useState, useCallback, useEffect } from 'react';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackData?: any;
  onError?: (error: Error, retryCount: number) => void;
  onRecovery?: (retryCount: number) => void;
}

interface ErrorRecoveryState {
  error: Error | null;
  isLoading: boolean;
  retryCount: number;
  hasRecovered: boolean;
}

export function useErrorRecovery<T>(
  asyncFunction: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    fallbackData = null,
    onError,
    onRecovery
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isLoading: false,
    retryCount: 0,
    hasRecovered: false
  });

  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (isRetry = false) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      hasRecovered: false
    }));

    try {
      const result = await asyncFunction();
      setData(result);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        hasRecovered: isRetry && prev.retryCount > 0
      }));

      if (isRetry && state.retryCount > 0) {
        onRecovery?.(state.retryCount);
      }

      return result;
    } catch (error) {
      const currentRetryCount = isRetry ? state.retryCount + 1 : 1;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
        retryCount: currentRetryCount,
        hasRecovered: false
      }));

      onError?.(error as Error, currentRetryCount);

      // Auto-retry if under max retries
      if (currentRetryCount < maxRetries) {
        setTimeout(() => {
          execute(true);
        }, retryDelay * currentRetryCount); // Exponential backoff
      } else {
        // Max retries reached, use fallback data if available
        if (fallbackData !== null) {
          setData(fallbackData);
        }
      }

      throw error;
    }
  }, [asyncFunction, maxRetries, retryDelay, fallbackData, onError, onRecovery, state.retryCount]);

  const retry = useCallback(() => {
    if (state.retryCount < maxRetries) {
      execute(true);
    }
  }, [execute, state.retryCount, maxRetries]);

  const reset = useCallback(() => {
    setState({
      error: null,
      isLoading: false,
      retryCount: 0,
      hasRecovered: false
    });
    setData(null);
  }, []);

  return {
    data,
    error: state.error,
    isLoading: state.isLoading,
    retryCount: state.retryCount,
    hasRecovered: state.hasRecovered,
    canRetry: state.retryCount < maxRetries,
    execute,
    retry,
    reset
  };
}

// Hook for API calls with automatic error recovery
export function useApiWithRecovery<T>(
  url: string,
  options: RequestInit = {},
  recoveryOptions: ErrorRecoveryOptions = {}
) {
  const apiCall = useCallback(async (): Promise<T> => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }, [url, options]);

  return useErrorRecovery(apiCall, recoveryOptions);
}

// Hook for localStorage operations with error recovery
export function useLocalStorageWithRecovery<T>(
  key: string,
  defaultValue: T,
  options: ErrorRecoveryOptions = {}
) {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);

  const getValue = useCallback(async (): Promise<T> => {
    try {
      if (typeof window === 'undefined') {
        return defaultValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      throw new Error(`Failed to read from localStorage: ${error}`);
    }
  }, [key, defaultValue]);

  const setValue = useCallback(async (value: T): Promise<void> => {
    try {
      if (typeof window === 'undefined') {
        throw new Error('localStorage not available');
      }

      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
      throw new Error(`Failed to write to localStorage: ${error}`);
    }
  }, [key]);

  const {
    data,
    error,
    isLoading,
    retryCount,
    hasRecovered,
    canRetry,
    execute,
    retry,
    reset
  } = useErrorRecovery(getValue, {
    fallbackData: defaultValue,
    ...options
  });

  // Load initial value
  useEffect(() => {
    execute();
  }, [execute]);

  // Update stored value when data changes
  useEffect(() => {
    if (data !== null && data !== undefined) {
      setStoredValue(data);
    }
  }, [data]);

  return {
    value: storedValue,
    setValue,
    error,
    isLoading,
    retryCount,
    hasRecovered,
    canRetry,
    retry,
    reset
  };
}
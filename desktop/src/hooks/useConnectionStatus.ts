/**
 * Hook to monitor backend connection status
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { healthCheck } from '../lib/api';
import type { ConnectionStatus } from '../types';

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const RETRY_DELAY = 5000; // 5 seconds

export function useConnectionStatus(backendUrl?: string) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      await healthCheck();
      setStatus('connected');
      setLastPingTime(Date.now());
    } catch (error) {
      console.warn('Health check failed:', error);
      setStatus((prevStatus) => {
        if (prevStatus === 'connected') {
          return 'reconnecting';
        }
        return 'disconnected';
      });
    }
  }, []);

  const startMonitoring = useCallback(() => {
    // Initial check with error handling
    checkHealth().catch((error) => {
      console.warn('Initial health check failed:', error);
      setStatus('disconnected');
    });

    // Set up interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      checkHealth().catch((error) => {
        console.warn('Periodic health check failed:', error);
      });
    }, HEALTH_CHECK_INTERVAL);
  }, [checkHealth]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    setStatus('connecting');
    checkHealth().catch((error) => {
      console.warn('Reconnect health check failed:', error);
      setStatus('disconnected');
    });
    
    // Retry logic
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    retryTimeoutRef.current = setTimeout(() => {
      setStatus((currentStatus) => {
        if (currentStatus !== 'connected') {
          reconnect();
        }
        return currentStatus;
      });
    }, RETRY_DELAY);
  }, [checkHealth]);

  useEffect(() => {
    // Delay initial check to avoid blocking render
    const timeoutId = setTimeout(() => {
      startMonitoring();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    status,
    lastPingTime,
    reconnect,
    checkHealth,
  };
}

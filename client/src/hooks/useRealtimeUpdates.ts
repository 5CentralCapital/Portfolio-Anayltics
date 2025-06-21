import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeUpdateOptions {
  interval?: number;
  queryKeys?: string[];
  enabled?: boolean;
}

export function useRealtimeUpdates(options: RealtimeUpdateOptions = {}) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout>();
  const {
    interval = 30000, // 30 seconds default
    queryKeys = ['/api/properties', '/api/user/entities', '/api/dashboard'],
    enabled = true
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const updateQueries = () => {
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    };

    // Initial update
    updateQueries();

    // Set up interval
    intervalRef.current = setInterval(updateQueries, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [queryClient, interval, enabled, queryKeys]);

  const forceUpdate = () => {
    queryKeys.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  };

  return { forceUpdate };
}

// Smart cache invalidation for related data
export function useSmartCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateRelatedQueries = (dataType: string, entityId?: number) => {
    const cacheMap: Record<string, string[]> = {
      property: [
        '/api/properties',
        '/api/dashboard',
        '/api/property-performance',
        entityId ? `/api/user/${entityId}/entities` : '/api/user/entities'
      ],
      entity: [
        '/api/user/entities',
        '/api/dashboard',
        '/api/properties'
      ],
      financial: [
        '/api/dashboard',
        '/api/revenue-trends',
        '/api/property-performance'
      ]
    };

    const queriesToInvalidate = cacheMap[dataType] || [];
    queriesToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  };

  return { invalidateRelatedQueries };
}
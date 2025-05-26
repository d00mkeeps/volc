// hooks/dashboard/useDashboardData.ts
import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';

export function useDashboardData() {
  const store = useDashboardStore();
  
  // Auto-load on mount if no data and not already loading
  useEffect(() => {
    if (!store.goalProgress && !store.isLoading && !store.error) {
      store.refreshDashboard();
    }
  }, [store.goalProgress, store.isLoading, store.error, store.refreshDashboard]);
  
  return {
    goalProgress: store.goalProgress,
    muscleBalance: store.muscleBalance,
    consistency: store.consistency,
    isLoading: store.isLoading,
    error: store.error,
    refresh: store.refreshDashboard
  };
}
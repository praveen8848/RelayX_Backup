import { useQuery } from '@tanstack/react-query';
import { 
  getDashboardMetrics, 
  getRelayStatus, 
  getGlobalHealth, 
  getOutboxStats, 
  getRecentEvents 
} from '../api/endpoints';

export const useDashboardData = () => {
  const metrics = useQuery({ 
    queryKey: ['dashboardMetrics'], 
    queryFn: getDashboardMetrics, 
    refetchInterval: 5000 
  });
  
  const relayStatus = useQuery({ 
    queryKey: ['relayStatus'], 
    queryFn: getRelayStatus, 
    refetchInterval: 5000 
  });
  
  const outboxStats = useQuery({ 
    queryKey: ['outboxStats'], 
    queryFn: getOutboxStats, 
    refetchInterval: 5000 
  });
  
  const health = useQuery({ 
    queryKey: ['globalHealth'], 
    queryFn: getGlobalHealth, 
    refetchInterval: 15000 
  });
  
  const recentEvents = useQuery({ 
    queryKey: ['recentEvents'], 
    queryFn: getRecentEvents, 
    refetchInterval: 10000 
  });

  return { metrics, relayStatus, outboxStats, health, recentEvents };
};
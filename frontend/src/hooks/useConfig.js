import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () => apiRequest('/config/public'),
    staleTime: Infinity,
  });
}

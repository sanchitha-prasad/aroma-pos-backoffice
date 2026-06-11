import { useQuery } from '@tanstack/react-query';
import { permissionsService, PermissionsResponse } from '../services/api/permissions.service';
import { Permission } from '../types';
import { ALL_PERMISSIONS } from '../constants/index';

/**
 * Fetch permissions from API with fallback to hardcoded permissions
 */
export const usePermissions = () => {
  return useQuery<Permission[], Error>({
    queryKey: ['permissions'],
    queryFn: async () => {
      try {
        const response = await permissionsService.fetchPermissions();
        return permissionsService.flattenPermissions(response);
      } catch (error) {
        console.warn('Failed to fetch permissions from API, using fallback', error);
        // Fallback to hardcoded permissions
        return ALL_PERMISSIONS;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    // cacheTime: 1000 * 60 * 60, // 1 hour
  });
};

import { apiClient } from "@/src/shared/services/api/client";
import { Permission, ApplicationType } from '../../types';


export interface PermissionModule {
  key: string;
  label: string;
  permissions: Permission[];
}

export interface PermissionApplication {
  application: ApplicationType;
  modules: PermissionModule[];
}

export interface PermissionsResponse {
  applications: PermissionApplication[];
}

/**
 * Fetch permissions from the API and flatten them into a single Permission[] array
 */
export const permissionsService = {
  async fetchPermissions(): Promise<PermissionsResponse> {
    try {
      const response = await apiClient.get<PermissionsResponse>('/api/permissions');
      return response;
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      throw error;
    }
  },

  /**
   * Flatten nested API response into a single Permission[] array
   */
  flattenPermissions(response: PermissionsResponse): Permission[] {
    const flattened: Permission[] = [];

    response.applications.forEach(app => {
      app.modules.forEach(module => {
        module.permissions.forEach(perm => {
          flattened.push({
            key: perm.key,
            label: perm.label,
            group: module.label,
            description: perm.description,
            application: app.application,
          });
        });
      });
    });

    return flattened;
  },

  /**
   * Transform API response to nested structure for advanced use cases
   */
  getApplicationModules(response: PermissionsResponse, app: ApplicationType): PermissionModule[] {
    const appData = response.applications.find(a => a.application === app);
    return appData ? appData.modules : [];
  },
};

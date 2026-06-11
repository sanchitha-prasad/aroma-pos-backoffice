import { apiClient } from '../../../shared/services/api/client';
import { Employee, Device, Role, Activity, Branch, DeviceType, DeviceProtocol } from '../../../shared/types';

export const systemService = {
    getDeviceTypes: () => apiClient.get<DeviceType[]>('/api/devices/device-types'),
    getDeviceProtocols: () => apiClient.get<DeviceProtocol[]>('/api/devices/device-protocols'),

    // --- Roles & Permissions ---
    getRolePermissions: () =>
        apiClient.get<{ roles: Record<Role, string[]> }>('/api/permissions/roles', {
            skipErrorRedirect: true,
            suppressErrorToast: true,
        }),

    updateRolePermissions: (data: Record<Role, string[]>) =>
        apiClient.put<void>('/api/permissions/roles', { roles: data }),

    // --- Activity Logs ---
    // getActivities: () => apiClient.get<Activity[]>('/api/activities'),
    // logActivity: (data: { action: string, target: string, user: string }) => apiClient.post<void>('/api/activities', data),
};
import { apiClient } from '../../../shared/services/api/client';
import { Employee, Device, Role, Activity, Branch, DeviceType, DeviceProtocol } from '../../../shared/types';

export const systemService = {
    getDeviceTypes: () => apiClient.get<DeviceType[]>('/api/devices/device-types'),
    getDeviceProtocols: () => apiClient.get<DeviceProtocol[]>('/api/devices/device-protocols'),

    // --- Roles & Permissions ---
    // getPermissions: () => apiClient.get<Record<Role, string[]>>('/api/permissions', { skipErrorRedirect: true, suppressErrorToast: true }),
    // updatePermissions: (data: Record<Role, string[]>) => apiClient.put<void>('/api/permissions', data),

    // --- Activity Logs ---
    // getActivities: () => apiClient.get<Activity[]>('/api/activities'),
    // logActivity: (data: { action: string, target: string, user: string }) => apiClient.post<void>('/api/activities', data),
};
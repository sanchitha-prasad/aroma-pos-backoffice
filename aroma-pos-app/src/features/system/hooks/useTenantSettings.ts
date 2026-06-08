import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { apiClient } from '@/src/shared/services/api/client';
import { authStore } from '@/src/shared/services/auth/authStore';

export interface TenantSetting {
    key: string;
    value: string;
}

export interface TenantDetail {
    ownerEmail?: string;
    OwnerEmail?: string;
    email?: string;
    Email?: string;
}

export interface TenantUser {
    name: string;
    email: string;
    phoneNumber?: string;
    phone?: string;
    loginNumber?: string;
}

export const TENANT_SETTINGS_KEY = ['tenant-settings'] as const;
export const TENANT_DETAIL_KEY = (tenantId: string) => ['tenant', tenantId] as const;
export const TENANT_USERS_KEY = (tenantId: string) => ['tenant-users', tenantId] as const;

export function useTenantSettings() {
    return useQuery<TenantSetting[]>({
        queryKey: TENANT_SETTINGS_KEY,
        queryFn: () => apiClient.get<TenantSetting[]>('/api/tenant-settings'),
        staleTime: 5 * 60_000,
        enabled: !!authStore.accessToken && !!authStore.tenantId,
    });
}

export function useTenantSettingsMap() {
    const { data, ...rest } = useTenantSettings();
    const settingsMap: Record<string, string> = {};
    (data || []).forEach((item) => { settingsMap[item.key] = item.value; });
    return { data: settingsMap, raw: data, ...rest };
}

export function useTenantDetail() {
    const tenantId = authStore.tenantId;
    return useQuery<TenantDetail>({
        queryKey: TENANT_DETAIL_KEY(tenantId || ''),
        queryFn: () => apiClient.get<TenantDetail>(`/api/tenants/${tenantId}`),
        staleTime: 10 * 60_000,
        enabled: !!authStore.accessToken && !!tenantId,
    });
}

export function useTenantUsers() {
    const tenantId = authStore.tenantId;
    return useQuery<TenantUser[]>({
        queryKey: TENANT_USERS_KEY(tenantId || ''),
        queryFn: () => apiClient.get<TenantUser[]>(`/api/tenants/${tenantId}/users`),
        staleTime: 10 * 60_000,
        enabled: !!authStore.accessToken && !!tenantId,
    });
}

export function useUpdateTenantSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: TenantSetting[]) =>
            apiClient.put('/api/tenant-settings', payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: TENANT_SETTINGS_KEY });
            message.success('Configurations saved successfully!');
        },
        onError: () => message.error('Failed to save configurations.'),
    });
}

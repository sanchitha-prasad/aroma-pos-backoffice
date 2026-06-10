import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import type { Device, DeviceType, DeviceProtocol } from '@/src/shared/types';

export const DEVICES_KEY          = ['devices']           as const;
export const DEVICE_TYPES_KEY     = ['device-types']      as const;
export const DEVICE_PROTOCOLS_KEY = ['device-protocols']  as const;

export function useDevices() {
    return useQuery<Device[]>({
        queryKey: DEVICES_KEY,
        queryFn: () => apiClient.get<Device[]>('/api/devices'),
        staleTime: 5 * 60_000,
    });
}

export function useDeviceTypes() {
    return useQuery<DeviceType[]>({
        queryKey: DEVICE_TYPES_KEY,
        queryFn: () => apiClient.get<DeviceType[]>('/api/devices/device-types'),
        staleTime: 60 * 60_000,
    });
}

export function useDeviceProtocols() {
    return useQuery<DeviceProtocol[]>({
        queryKey: DEVICE_PROTOCOLS_KEY,
        queryFn: () => apiClient.get<DeviceProtocol[]>('/api/devices/device-protocols'),
        staleTime: 60 * 60_000,
    });
}

export function useCreateDevice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<Device, 'id' | 'type' | 'protocol'>) =>
            apiClient.post<Device>('/api/devices', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: DEVICES_KEY }),
    });
}

export function useUpdateDevice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Device> }) =>
            apiClient.put<Device>(`/api/devices/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: DEVICES_KEY }),
    });
}

export function useDeleteDevice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete<void>(`/api/devices/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: DEVICES_KEY }),
    });
}

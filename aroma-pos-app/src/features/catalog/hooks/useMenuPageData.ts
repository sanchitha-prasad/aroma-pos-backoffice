import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import type { Category, ModifierGroup, Device } from '@/src/shared/types';

export const CATEGORIES_KEY      = ['categories']       as const;
export const MODIFIER_GROUPS_KEY = ['modifier-groups']  as const;
export const DEVICES_KEY         = ['devices']          as const;

export function useCategories() {
    return useQuery<Category[]>({
        queryKey: CATEGORIES_KEY,
        queryFn: () => apiClient.get<Category[]>('/api/categories'),
        staleTime: 5 * 60_000,
    });
}

export function useModifierGroups() {
    return useQuery<ModifierGroup[]>({
        queryKey: MODIFIER_GROUPS_KEY,
        queryFn: () => apiClient.get<ModifierGroup[]>('/api/modifier-groups'),
        staleTime: 5 * 60_000,
    });
}

export function useDevices() {
    return useQuery<Device[]>({
        queryKey: DEVICES_KEY,
        queryFn: () => apiClient.get<Device[]>('/api/devices'),
        staleTime: 5 * 60_000,
    });
}

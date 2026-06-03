import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import type { Category, ModifierGroup, Device, Tax } from '@/src/shared/types';

export const CATEGORIES_KEY      = ['categories']       as const;
export const MODIFIER_GROUPS_KEY = ['modifier-groups']  as const;
export const DEVICES_KEY         = ['devices']          as const;
export const TAXES_KEY           = ['taxes']            as const;

export function useCategories() {
    return useQuery<Category[]>({
        queryKey: CATEGORIES_KEY,
        queryFn: () => apiClient.get<Category[]>('/api/categories'),
        staleTime: 5 * 60_000,
    });
}

export function useCreateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<Category, 'id'>) =>
            apiClient.post<Category>('/api/categories', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
    });
}

export function useUpdateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
            apiClient.put<Category>(`/api/categories/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
    });
}

export function useDeleteCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete<void>(`/api/categories/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
    });
}

export function useModifierGroups() {
    return useQuery<ModifierGroup[]>( {
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

export function useTaxes() {
    return useQuery<Tax[]>({
        queryKey: TAXES_KEY,
        queryFn: () => apiClient.get<Tax[]>('/api/taxes'),
        staleTime: 5 * 60_000,
    });
}

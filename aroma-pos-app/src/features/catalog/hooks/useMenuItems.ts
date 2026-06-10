import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import type { MenuItem } from '@/src/shared/types';

export const MENU_ITEMS_KEY = ['menu-items'] as const;

export function useMenuItems() {
    return useQuery<MenuItem[]>({
        queryKey: MENU_ITEMS_KEY,
        queryFn: () => apiClient.get<MenuItem[]>('/api/items'),
        staleTime: 60_000,
    });
}

export function useCreateMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<MenuItem, 'id'>) =>
            apiClient.post<MenuItem>('/api/items', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: MENU_ITEMS_KEY }),
    });
}

export function useUpdateMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) =>
            apiClient.put<MenuItem>(`/api/items/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: MENU_ITEMS_KEY }),
    });
}

export function useDeleteMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete<void>(`/api/items/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: MENU_ITEMS_KEY }),
    });
}

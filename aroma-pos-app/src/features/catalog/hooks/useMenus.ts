import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import type { MenuEntity } from '@/src/shared/types';

export const MENUS_KEY = ['menus'] as const;

export function useMenus() {
    return useQuery<MenuEntity[]>({
        queryKey: MENUS_KEY,
        queryFn: () => apiClient.get<MenuEntity[]>('/api/menus'),
        staleTime: 60_000,
    });
}

export function useCreateMenu() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<MenuEntity, 'id' | 'categories'>) =>
            apiClient.post<MenuEntity>('/api/menus', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: MENUS_KEY }),
    });
}

export function useUpdateMenu() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MenuEntity> }) =>
            apiClient.put<MenuEntity>(`/api/menus/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: MENUS_KEY }),
    });
}

export function useDeleteMenu() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete<void>(`/api/menus/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: MENUS_KEY }),
    });
}

export function useAssignCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ menuId, categoryId }: { menuId: string; categoryId: string }) =>
            apiClient.post<void>(`/api/menus/${menuId}/categories`, { categoryId }),
        onSuccess: () => qc.invalidateQueries({ queryKey: MENUS_KEY }),
    });
}

export function useRemoveCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ menuId, categoryId }: { menuId: string; categoryId: string }) =>
            apiClient.delete<void>(`/api/menus/${menuId}/categories/${categoryId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: MENUS_KEY }),
    });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import type { MenuEntity } from '@/src/shared/types';

export const MENUS_KEY = ['menus'] as const;

/**
 * Payloads mirror the backend contract (CreateMenuRequest / UpdateMenuRequest):
 * categories are managed atomically via `categoryIds` — there are no separate
 * assign/remove endpoints. The backend `IsActive` defaults to `true`, so updates
 * must always send `isActive` explicitly to avoid silently re-activating a menu.
 */
export interface CreateMenuPayload {
    title: string;
    subtitle?: string;
    isActive: boolean;
    categoryIds: string[];
}

export interface UpdateMenuPayload {
    title?: string;
    subtitle?: string;
    isActive: boolean;
    categoryIds?: string[];
}

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
        mutationFn: (data: CreateMenuPayload) =>
            apiClient.post<MenuEntity>('/api/menus', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: MENUS_KEY }),
    });
}

export function useUpdateMenu() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateMenuPayload }) =>
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

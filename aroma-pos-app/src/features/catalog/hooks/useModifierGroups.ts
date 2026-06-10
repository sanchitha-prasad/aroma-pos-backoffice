import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import type { ModifierGroup } from '@/src/shared/types';

export const MODIFIER_GROUPS_KEY = ['modifier-groups'] as const;

export function useModifierGroups() {
    return useQuery<ModifierGroup[]>( {
        queryKey: MODIFIER_GROUPS_KEY,
        queryFn: () => apiClient.get<ModifierGroup[]>('/api/modifier-groups'),
        staleTime: 60_000,
    });
}

export function useCreateModifierGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<ModifierGroup, 'id' | 'modifierItems'> & { modifierItems: any[] }) =>
            apiClient.post<ModifierGroup>('/api/modifier-groups', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: MODIFIER_GROUPS_KEY }),
    });
}

export function useUpdateModifierGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ModifierGroup> }) =>
            apiClient.put<ModifierGroup>(`/api/modifier-groups/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: MODIFIER_GROUPS_KEY }),
    });
}

export function useDeleteModifierGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete<void>(`/api/modifier-groups/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: MODIFIER_GROUPS_KEY }),
    });
}

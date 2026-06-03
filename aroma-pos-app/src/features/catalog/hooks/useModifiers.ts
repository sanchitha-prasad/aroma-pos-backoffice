import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import type { Modifier } from '@/src/shared/types';

export const MODIFIERS_KEY = ['modifiers'] as const;

export function useModifiers() {
    return useQuery<Modifier[]>({
        queryKey: MODIFIERS_KEY,
        queryFn: () => apiClient.get<Modifier[]>('/api/modifiers'),
        staleTime: 60_000,
    });
}

export function useCreateModifier() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<Modifier, 'id'>) =>
            apiClient.post<Modifier>('/api/modifiers', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: MODIFIERS_KEY }),
    });
}

export function useUpdateModifier() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Modifier> }) =>
            apiClient.put<Modifier>(`/api/modifiers/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: MODIFIERS_KEY }),
    });
}

export function useDeleteModifier() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete<void>(`/api/modifiers/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: MODIFIERS_KEY }),
    });
}

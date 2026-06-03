import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import type { Variant } from '@/src/shared/types';

export const VARIANTS_KEY = ['variants'] as const;

export function useVariants() {
    return useQuery<Variant[]>({
        queryKey: VARIANTS_KEY,
        queryFn: () => apiClient.get<Variant[]>('/api/variants'),
        staleTime: 5 * 60_000,
    });
}

export function useCreateVariant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description?: string }) =>
            apiClient.post<Variant>('/api/variants', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: VARIANTS_KEY }),
    });
}

export function useUpdateVariant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
            apiClient.put<Variant>(`/api/variants/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: VARIANTS_KEY }),
    });
}

export function useDeleteVariant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete<void>(`/api/variants/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: VARIANTS_KEY }),
    });
}

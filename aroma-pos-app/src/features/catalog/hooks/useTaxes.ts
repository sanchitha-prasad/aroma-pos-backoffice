import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import type { Tax } from '@/src/shared/types';

export const TAXES_KEY = ['taxes'] as const;

export function useTaxes() {
    return useQuery<Tax[]>({
        queryKey: TAXES_KEY,
        queryFn: () => apiClient.get<Tax[]>('/api/taxes'),
        staleTime: 5 * 60_000,
    });
}

export function useCreateTax() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; percentage: number; isActive?: boolean }) =>
            apiClient.post<Tax>('/api/taxes', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: TAXES_KEY }),
    });
}

export function useUpdateTax() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name: string; percentage: number; isActive: boolean } }) =>
            apiClient.put<Tax>(`/api/taxes/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: TAXES_KEY }),
    });
}

export function useDeleteTax() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete<void>(`/api/taxes/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: TAXES_KEY }),
    });
}

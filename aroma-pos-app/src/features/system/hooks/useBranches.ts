import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { apiClient } from '@/src/shared/services/api/client';
import type { Branch, CreateBranchDto } from '@/src/shared/types';

export const BRANCHES_KEY = ['branches'] as const;

export function useBranches() {
    return useQuery<Branch[]>({
        queryKey: BRANCHES_KEY,
        queryFn: () => apiClient.get<Branch[]>('/api/branches'),
        staleTime: 10 * 60_000,
    });
}

export function useCreateBranch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBranchDto) =>
            apiClient.post<Branch>('/api/branches', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BRANCHES_KEY });
            message.success('Branch created successfully');
        },
        onError: () => message.error('Failed to create branch'),
    });
}

export function useUpdateBranch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Branch> }) =>
            apiClient.put<Branch>(`/api/branches/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BRANCHES_KEY });
            message.success('Branch updated successfully');
        },
        onError: () => message.error('Failed to update branch'),
    });
}

export function useDeleteBranch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.delete<void>(`/api/branches/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BRANCHES_KEY });
            message.success('Branch deleted');
        },
        onError: () => message.error('Failed to delete branch'),
    });
}

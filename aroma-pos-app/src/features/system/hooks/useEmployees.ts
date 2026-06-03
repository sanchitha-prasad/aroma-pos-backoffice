import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import { authStore } from '@/src/shared/services/auth/authStore';
import type { Employee } from '@/src/shared/types';

export const EMPLOYEES_KEY = ['employees'] as const;

export function useEmployees() {
    const tenantId = authStore.tenantId;
    return useQuery<Employee[]>({
        queryKey: [...EMPLOYEES_KEY, tenantId],
        queryFn: () => apiClient.get<Employee[]>(`/api/tenants/${tenantId}/users`),
        enabled: !!tenantId,
        staleTime: 5 * 60_000,
    });
}

export function useCreateEmployee() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<Employee, 'id'>) =>
            apiClient.post<Employee>(`/api/tenants/${authStore.tenantId}/users`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
    });
}

export function useUpdateEmployee() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
            apiClient.put<Employee>(`/api/tenants/${authStore.tenantId}/users/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
    });
}

export function useDeleteEmployee() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.delete<void>(`/api/tenants/${authStore.tenantId}/users/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
    });
}

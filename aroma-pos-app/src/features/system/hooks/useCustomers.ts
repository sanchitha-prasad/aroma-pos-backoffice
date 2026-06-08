import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { apiClient } from '@/src/shared/services/api/client';
import { CustomerStatus } from '@/src/shared/enums';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/src/shared/types/system/Customer';

export const CUSTOMERS_KEY = ['customers'] as const;

function mapStatus(status: string | number): CustomerStatus {
    if (status === 1 || status === '1' || status === 'Active') return CustomerStatus.Active;
    if (status === 2 || status === '2' || status === 'Inactive') return CustomerStatus.Inactive;
    if (status === 3 || status === '3' || status === 'Blocked') return CustomerStatus.Blocked;
    return CustomerStatus.Active;
}

export function useCustomers() {
    return useQuery<Customer[]>({
        queryKey: CUSTOMERS_KEY,
        queryFn: async () => {
            const data = await apiClient.get<any[]>('/api/customers');
            return (data || []).map((c) => ({ ...c, status: mapStatus(c.status) }));
        },
        staleTime: 2 * 60_000,
    });
}

export function useCreateCustomer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateCustomerRequest) =>
            apiClient.post<Customer>('/api/customers', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CUSTOMERS_KEY });
            message.success('Customer created successfully');
        },
    });
}

export function useUpdateCustomer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
            apiClient.put<Customer>(`/api/customers/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CUSTOMERS_KEY });
            message.success('Customer updated successfully');
        },
    });
}

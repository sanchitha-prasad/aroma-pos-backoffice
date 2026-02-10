import { ServiceResponse } from '@/src/shared/types/serviceResponse';
import { apiClient } from '../../../shared/services/api/client';
import { Order } from '../../../shared/types';
import { handleRequest } from '@/src/shared/services/api/handleRequest';

export const orderService = {
    getOrders:  async (): Promise<ServiceResponse<Order[]>> => {
        return handleRequest<Order[]>(apiClient.get('/api//orders'));
    },
    createOrder: (data: Omit<Order, 'id'>) => apiClient.post<Order>('/orders', data),
    updateOrder: (id: string, data: Partial<Order>) => apiClient.put<Order>(`/orders/${id}`, data),
    deleteOrder: (id: string) => apiClient.delete<void>(`/orders/${id}`),
};
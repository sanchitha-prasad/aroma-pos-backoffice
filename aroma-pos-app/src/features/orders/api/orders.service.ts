import { apiClient } from '@/src/shared/services/api/client';
import type { OrderDetailResponse } from '../types/order-detail.types';

export const ordersService = {
    /** GET /api/orders  — returns full list with nested tickets/items/payments */
    getOrders: (): Promise<OrderDetailResponse[]> =>
        apiClient.get<OrderDetailResponse[]>('/api/orders'),

    /** GET /api/orders/{id} — single order (used only if detail needs refresh) */
    getOrderById: (id: string): Promise<OrderDetailResponse> =>
        apiClient.get<OrderDetailResponse>(`/api/orders/${id}`),
};

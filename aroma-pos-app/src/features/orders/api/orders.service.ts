import { apiClient } from '@/src/shared/services/api/client';
import { authStore } from '@/src/shared/services/auth/authStore';
import type { OrderDetailResponse } from '../types/order-detail.types';

interface PaginatedOrdersResponse {
    data: OrderDetailResponse[];
    meta: { currentPage: number; itemsPerPage: number; totalItems: number; totalPages: number };
    links: { first: string; last: string; next: string; prev: string; current: string };
}

export const ordersService = {
    /** GET /api/orders  — paginated; extracts the data array for backwards-compat with useOrderList */
    getOrders: (): Promise<OrderDetailResponse[]> =>
        apiClient.get<PaginatedOrdersResponse>('/api/orders', {
            params: { BranchId: authStore.branchId, limit: 500 },
        }).then(r => r.data),

    /** GET /api/orders/{id} — single order (used only if detail needs refresh) */
    getOrderById: (id: string): Promise<OrderDetailResponse> =>
        apiClient.get<OrderDetailResponse>(`/api/orders/${id}`),
};

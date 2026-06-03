import { useQuery } from '@tanstack/react-query';
import { orderService } from '../api/order.service';
import { Order } from '../../../shared/types';

export const ORDER_QUERY_KEY = ['orders'] as const;

export function useOrders() {
    const query = useQuery<Order[], Error>({
        queryKey: ORDER_QUERY_KEY,
        queryFn: async () => {
            const res = await orderService.getOrders();
            if (!res.success) throw new Error(res.message ?? 'Failed to load orders');
            return res.data ?? [];
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });

    return {
        orders: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}

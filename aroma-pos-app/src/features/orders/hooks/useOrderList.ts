import { useQuery } from '@tanstack/react-query';
import { ordersService } from '../api/orders.service';

export const ORDERS_QUERY_KEY = 'orders-list';

export function useOrderList() {
    return useQuery({
        queryKey: [ORDERS_QUERY_KEY],
        queryFn: () => ordersService.getOrders(),
        staleTime: 1000 * 60, // 1 min
    });
}

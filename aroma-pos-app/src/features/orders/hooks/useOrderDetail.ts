import { useQuery } from '@tanstack/react-query';
import { ordersService } from '../api/orders.service';

export const ORDER_DETAIL_QUERY_KEY = 'order-detail';

export function useOrderDetail(orderId: string | null) {
    return useQuery({
        queryKey: [ORDER_DETAIL_QUERY_KEY, orderId],
        queryFn: () => ordersService.getOrderById(orderId!),
        enabled: !!orderId,
        staleTime: 1000 * 60 * 5,
    });
}

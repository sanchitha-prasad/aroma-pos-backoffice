import { apiClient } from '../../../shared/services/api/client';
import { handleRequest } from '../../../shared/services/api/handleRequest';
import { Order } from '../../../shared/types';
import { ServiceResponse } from '../../../shared/types/serviceResponse';

export const orderService = {
    getOrders: (): Promise<ServiceResponse<Order[]>> =>
        handleRequest<Order[]>(apiClient.get('/api/orders')),
};

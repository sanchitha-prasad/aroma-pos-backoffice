import { apiClient } from "@/src/shared/services/api/client";
import { handleRequest } from "@/src/shared/services/api/handleRequest";
import { MenuItem } from "@/src/shared/types";
import { ServiceResponse } from "@/src/shared/types/serviceResponse";

export const ProductService = {
    getProducts: async (): Promise<ServiceResponse<MenuItem[]>> => {
        return handleRequest<MenuItem[]>(apiClient.get('/api/items'));
    },
    createProduct: async (data: Omit<MenuItem, 'id'>): Promise<ServiceResponse<MenuItem>> => {
        return handleRequest<MenuItem>(apiClient.post('/api/items', data));
    },
    updateProduct: async (id: string, data: Partial<MenuItem>): Promise<ServiceResponse<MenuItem>> => {
        return handleRequest<MenuItem>(apiClient.put(`/api/items/${id}`, data));
    },
    deleteProduct: async (id: string): Promise<ServiceResponse<void>> => {
        return handleRequest<void>(apiClient.delete(`/api/items/${id}`));
    },
    getItemsByCategory: async (categoryId: string): Promise<ServiceResponse<MenuItem[]>> => {
        return handleRequest<MenuItem[]>(apiClient.get(`/api/categories/${categoryId}/items`));
    },
} 
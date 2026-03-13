import { apiClient } from "@/src/shared/services/api/client";
import { handleRequest } from "@/src/shared/services/api/handleRequest";
import { ServiceResponse } from "@/src/shared/types/serviceResponse";
import { Customer } from "@/src/shared/types/system/Customer";
import { CreateCustomerRequest,UpdateCustomerRequest} from "@/src/shared/types/system/Customer";

export const CustomersService = {
    getCustomers: async (): Promise<ServiceResponse<Customer[]>> => {
        return handleRequest<Customer[]>(apiClient.get('/api/customers'));
    },

    createCustomer: async (data: CreateCustomerRequest): Promise<ServiceResponse<Customer>> => {
        return handleRequest<Customer>(apiClient.post('/api/customers', data));
    },

    updateCustomer: async (id: string, data: UpdateCustomerRequest): Promise<ServiceResponse<Customer>> => {
        return handleRequest<Customer>(apiClient.put(`/api/customers/${id}`, data));
    },
        // getCustomerById: async (id: string): Promise<ServiceResponse<Customer>> => {
    //     return handleRequest<Customer>(apiClient.get(`/api/customers/${id}`));
    // },

    // deleteCustomer: async (id: string): Promise<ServiceResponse<void>> => {
    //     return handleRequest<void>(apiClient.delete(`/api/customers/${id}`));
    // }

};
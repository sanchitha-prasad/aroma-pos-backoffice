import { apiClient } from "@/src/shared/services/api/client";
import { handleRequest } from "@/src/shared/services/api/handleRequest";
import { Employee } from "@/src/shared/types";
import { ServiceResponse } from "@/src/shared/types/serviceResponse";

export const EmployeesService ={

    getEmployees: async (tenantId: string): Promise<ServiceResponse<Employee[]>> => {
        return handleRequest<Employee[]>( apiClient.get(`/api/tenants/${tenantId}/users`) );
},
    createEmployee: async (tenantId: string, data: Omit<Employee, 'id'>): Promise<ServiceResponse<Employee>> => {
        return handleRequest<Employee>(apiClient.post(`/api/tenants/${tenantId}/users`, data));
    },
    updateEmployee: async (tenantId: string, id: string, data: Partial<Employee>): Promise<ServiceResponse<Employee>> => {
        return handleRequest<Employee>(apiClient.put(`/api/tenants/${tenantId}/users/${id}`, data));
    },
    deleteEmployee: async (tenantId: string, id: string): Promise<ServiceResponse<void>> => {
        return handleRequest<void>(apiClient.delete(`/api/tenants/${tenantId}/users/${id}`));
    },
}
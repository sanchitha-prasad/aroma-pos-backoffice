import { apiClient } from "@/src/shared/services/api/client";
import { handleRequest } from "@/src/shared/services/api/handleRequest";
import { Employee } from "@/src/shared/types";
import { ServiceResponse } from "@/src/shared/types/serviceResponse";

export const EmployeesService ={

    getEmployees: async() : Promise<ServiceResponse<Employee[]>> => {
        return handleRequest<Employee[]>(apiClient.get('/api/users'));
    },
    createEmployee: async (data: Omit<Employee, 'id'>): Promise<ServiceResponse<Employee>> => {
        return handleRequest<Employee>(apiClient.post('/api/users', data));
    },
    updateEmployee: async (id: string, data: Partial<Employee>): Promise<ServiceResponse<Employee>> => {
        return handleRequest<Employee>(apiClient.put(`/api/users/${id}`, data));
    },
    deleteEmployee: async (id: string): Promise<ServiceResponse<void>> => {
        return handleRequest<void>(apiClient.delete(`/api/users/${id}`));
    },
}
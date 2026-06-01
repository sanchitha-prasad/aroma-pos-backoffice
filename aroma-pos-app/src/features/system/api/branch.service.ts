import { apiClient } from "@/src/shared/services/api/client";
import { handleRequest } from "@/src/shared/services/api/handleRequest";
import { Branch, CreateBranchDto } from "@/src/shared/types";
import { ServiceResponse } from "@/src/shared/types/serviceResponse";

export const BranchServices = {
getBranches: async (): Promise<ServiceResponse<Branch[]>> => {
    return handleRequest<Branch[]>(apiClient.get('/api/branches'));
},
    getBranch: async (id: string):Promise<ServiceResponse<Branch>>=>{
        return handleRequest<Branch>(apiClient.get(`/api/branches/${id}`));
    },
    createBranch: async (data:CreateBranchDto): Promise<ServiceResponse<Branch>> =>{
        return handleRequest<Branch>(apiClient.post('/api/branches/', data));
    },
    updateBranch: async (id: string, data: Partial<Branch>) : Promise<ServiceResponse<Branch>> => {
        return handleRequest<Branch>(apiClient.put(`/api/branches/${id}`, data));
    },
    
    deleteBranch:  async(id: string) : Promise<ServiceResponse<void>> => {
        return handleRequest<void>(apiClient.delete(`/api/branches/${id}`));
    },
}
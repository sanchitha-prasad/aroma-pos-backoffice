import { apiClient } from "@/src/shared/services/api/client";
import { handleRequest } from "@/src/shared/services/api/handleRequest";
import { ServiceResponse } from "@/src/shared/types/serviceResponse";
import { Device } from "@/types";


export const DeviceSevices = {
    getDevices: async (): Promise<ServiceResponse<Device[]>> => {
        return handleRequest<Device[]>(apiClient.get('/api/devices'));
    },
    createDevice: async (data: Omit<Device, 'id'>): Promise<ServiceResponse<Device>> => {
        return handleRequest<Device>(apiClient.post('/api/devices', data));
    },

    updateDevice: async (id: string, data: Partial<Device>): Promise<ServiceResponse<Device>> => {
        return handleRequest<Device>(apiClient.put(`/api/devices/${id}`, data));
    },

    deleteDevice: async (id: string): Promise<ServiceResponse<void>> => {
        return handleRequest<void>(apiClient.delete(`/api/devices/${id}`));
    },
}
import { apiClient } from "@/src/shared/services/api/client";
import { handleRequest } from "@/src/shared/services/api/handleRequest";
import { ServiceResponse } from "@/src/shared/types/serviceResponse";
import { Device } from "@/src/shared/types/system/Device";
import { DeviceType } from "@/src/shared/types/system/DeviceType";
import { DeviceProtocol } from "@/src/shared/types/system/DeviceProtocol";


export const DeviceSevices = {
    getDevices: async (): Promise<ServiceResponse<Device[]>> => {
        return handleRequest<Device[]>(apiClient.get('/api/devices'));
    },
    
    createDevice: async (data: Omit<Device, 'id' | 'status' | 'type' | 'protocol'>): Promise<ServiceResponse<Device>> => {
        return handleRequest<Device>(apiClient.post('/api/devices', data));
        },

    updateDevice: async (id: string, data: Partial<Device>): Promise<ServiceResponse<Device>> => {
        return handleRequest<Device>(apiClient.put(`/api/devices/${id}`, data));
    },

    deleteDevice: async (id: string): Promise<ServiceResponse<void>> => {
        return handleRequest<void>(apiClient.delete(`/api/devices/${id}`));
    },

    getDeviceTypes: async (): Promise<ServiceResponse<DeviceType[]>> => {
        return handleRequest<DeviceType[]>(apiClient.get('/api/devices/device-types'));
    },


    getDeviceProtocols: async (): Promise<ServiceResponse<DeviceProtocol[]>> => {
        return handleRequest<DeviceProtocol[]>(apiClient.get('/api/devices/device-protocols'));

}
}
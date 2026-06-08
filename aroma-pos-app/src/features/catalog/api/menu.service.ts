import { apiClient } from "@/src/shared/services/api/client";
import { handleRequest } from "@/src/shared/services/api/handleRequest";
import { MenuEntity } from "@/src/shared/types";
import { ServiceResponse } from "@/src/shared/types/serviceResponse";

export const MenuService = {
  getMenus: (): Promise<ServiceResponse<MenuEntity[]>> =>
    handleRequest(apiClient.get('/api/menus')),

  getMenu: (id: string): Promise<ServiceResponse<MenuEntity>> =>
    handleRequest(apiClient.get(`/api/menus/${id}`)),

  createMenu: (data: Omit<MenuEntity, 'id'>): Promise<ServiceResponse<MenuEntity>> =>
    handleRequest(apiClient.post('/api/menus', data)),

  updateMenu: (id: string, data: Partial<MenuEntity>): Promise<ServiceResponse<MenuEntity>> =>
    handleRequest(apiClient.put(`/api/menus/${id}`, data)),

  deleteMenu: (id: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.delete(`/api/menus/${id}`)),

  // Category associations
  assignCategory: (menuId: string, categoryId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.post(`/api/menus/${menuId}/categories`, { categoryId })),

  removeCategory: (menuId: string, categoryId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.delete(`/api/menus/${menuId}/categories/${categoryId}`)),
};

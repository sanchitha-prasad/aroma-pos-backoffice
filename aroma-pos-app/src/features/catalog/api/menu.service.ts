import { apiClient } from "@/src/shared/services/api/client";
import { handleRequest } from "@/src/shared/services/api/handleRequest";
import { MenuEntity } from "@/src/shared/types";
import { ServiceResponse } from "@/src/shared/types/serviceResponse";

/**
 * Mirrors the backend `MenusController`. Categories are NOT managed through
 * dedicated assign/remove endpoints — they are set atomically via the
 * `categoryIds` array on create/update (`menu.AssignToCategories` replaces the
 * full set). The backend requires at least one category on create.
 */
export interface CreateMenuRequest {
  title: string;
  subtitle?: string;
  isActive: boolean;
  categoryIds: string[];
}

export interface UpdateMenuRequest {
  title?: string;
  subtitle?: string;
  isActive: boolean;
  categoryIds?: string[];
}

export const MenuService = {
  getMenus: (): Promise<ServiceResponse<MenuEntity[]>> =>
    handleRequest(apiClient.get('/api/menus')),

  getMenu: (id: string): Promise<ServiceResponse<MenuEntity>> =>
    handleRequest(apiClient.get(`/api/menus/${id}`)),

  createMenu: (data: CreateMenuRequest): Promise<ServiceResponse<MenuEntity>> =>
    handleRequest(apiClient.post('/api/menus', data)),

  updateMenu: (id: string, data: UpdateMenuRequest): Promise<ServiceResponse<MenuEntity>> =>
    handleRequest(apiClient.put(`/api/menus/${id}`, data)),

  // Soft-delete (archive). Use `/permanent` for a hard delete.
  deleteMenu: (id: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.delete(`/api/menus/${id}`)),
};

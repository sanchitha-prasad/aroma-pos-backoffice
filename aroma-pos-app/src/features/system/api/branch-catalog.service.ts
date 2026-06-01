import { apiClient } from "@/src/shared/services/api/client";
import { handleRequest } from "@/src/shared/services/api/handleRequest";
import { ServiceResponse } from "@/src/shared/types/serviceResponse";
import {
  BranchCategoryAssignment,
  BranchItemAssignment,
  BranchMenuAssignment,
  BranchModifierAssignment,
  BranchModifierGroupAssignment,
  ServiceAvailability,
} from "@/src/shared/types";

// NOTE: Adjust endpoint paths to match your actual API routes.
export const BranchCatalogService = {
  // ── Menus ──────────────────────────────────────────────────────────────────
  getMenus: (branchId: string): Promise<ServiceResponse<BranchMenuAssignment[]>> =>
    handleRequest(apiClient.get(`/api/branches/${branchId}/menus`)),

  assignMenu: (branchId: string, menuId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.post(`/api/branches/${branchId}/menus`, { menuId })),

  unassignMenu: (branchId: string, menuId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.delete(`/api/branches/${branchId}/menus/${menuId}`)),

  updateMenu: (
    branchId: string,
    menuId: string,
    data: { isEnabled: boolean; serviceAvailabilities: ServiceAvailability[] }
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.put(`/api/branches/${branchId}/menus/${menuId}`, data)),

  // ── Categories ─────────────────────────────────────────────────────────────
  getCategories: (
    branchId: string,
    menuId: string
  ): Promise<ServiceResponse<BranchCategoryAssignment[]>> =>
    handleRequest(apiClient.get(`/api/branches/${branchId}/menus/${menuId}/categories`)),

  updateCategory: (
    branchId: string,
    categoryId: string,
    data: { isEnabled: boolean; serviceAvailabilities: ServiceAvailability[] }
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.put(`/api/branches/${branchId}/categories/${categoryId}`, data)),

  // ── Items ──────────────────────────────────────────────────────────────────
  getItems: (
    branchId: string,
    categoryId: string
  ): Promise<ServiceResponse<BranchItemAssignment[]>> =>
    handleRequest(apiClient.get(`/api/branches/${branchId}/categories/${categoryId}/items`)),

  updateItem: (
    branchId: string,
    itemId: string,
    data: {
      isEnabled: boolean;
      isSoldOut: boolean;
      serviceAvailabilities: ServiceAvailability[];
      variants: { itemVariantId: string; isEnabled: boolean; branchPrice?: number }[];
    }
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.put(`/api/branches/${branchId}/items/${itemId}`, data)),

  // ── Modifier Groups ────────────────────────────────────────────────────────
  getModifierGroups: (
    branchId: string,
    itemId: string
  ): Promise<ServiceResponse<BranchModifierGroupAssignment[]>> =>
    handleRequest(apiClient.get(`/api/branches/${branchId}/items/${itemId}/modifier-groups`)),

  updateModifierGroup: (
    branchId: string,
    modifierGroupId: string,
    data: { isEnabled: boolean; serviceAvailabilities: ServiceAvailability[] }
  ): Promise<ServiceResponse<void>> =>
    handleRequest(
      apiClient.put(`/api/branches/${branchId}/modifier-groups/${modifierGroupId}`, data)
    ),

  // ── Modifiers ──────────────────────────────────────────────────────────────
  getModifiers: (
    branchId: string,
    modifierGroupId: string
  ): Promise<ServiceResponse<BranchModifierAssignment[]>> =>
    handleRequest(
      apiClient.get(`/api/branches/${branchId}/modifier-groups/${modifierGroupId}/modifiers`)
    ),

  updateModifier: (
    branchId: string,
    modifierId: string,
    data: {
      isEnabled: boolean;
      branchPrice?: number;
      serviceAvailabilities: ServiceAvailability[];
    }
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.put(`/api/branches/${branchId}/modifiers/${modifierId}`, data)),
};

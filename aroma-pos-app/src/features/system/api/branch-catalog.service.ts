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

// ---------------------------------------------------------------------------
// Route helpers — ALL write operations live under /catalog/
// ---------------------------------------------------------------------------
const cat = (b: string) => `/api/branches/${b}/catalog`;
const cMenu = (b: string, m: string) => `${cat(b)}/menus/${m}`;

// ---------------------------------------------------------------------------
// ServiceAvailability shape transformers
//
// Frontend (internal): { dayOfWeek: number, startTime: "HH:mm", endTime: "HH:mm" }
// Backend (wire):      { dayOfWeek: number|null, timePeriods: [{ startTime: "HH:mm:ss", endTime: "HH:mm:ss" }] }
// ---------------------------------------------------------------------------

interface BackendTimePeriod  { startTime: string; endTime: string }
interface BackendAvailability { dayOfWeek: number | null; timePeriods: BackendTimePeriod[] }

/** Map the flat internal ServiceAvailability → nested backend request shape. */
const toBackendAvail = (a: ServiceAvailability): BackendAvailability => ({
  dayOfWeek: a.dayOfWeek,
  timePeriods: [{ startTime: `${a.startTime}:00`, endTime: `${a.endTime}:00` }],
});

/** Map one backend availability entry (first time-period) → flat internal shape. */
export const fromBackendAvail = (a: BackendAvailability): ServiceAvailability | null => {
  const tp = a.timePeriods?.[0];
  if (!tp || a.dayOfWeek == null) return null;
  const trim = (t: string) => t.substring(0, 5); // "HH:mm:ss" → "HH:mm"
  return { dayOfWeek: a.dayOfWeek, startTime: trim(tp.startTime), endTime: trim(tp.endTime) };
};

/** Map a backend response array → flat ServiceAvailability[]. */
export const parseAvailabilities = (raw: BackendAvailability[]): ServiceAvailability[] =>
  (raw ?? []).flatMap(a => {
    const mapped = fromBackendAvail(a);
    return mapped ? [mapped] : [];
  });

export const BranchCatalogService = {

  // ── GET: hierarchy read ──────────────────────────────────────────────────

  /** All menus assigned to the branch with their IsEnabled + availabilities. */
  getMenus: (branchId: string): Promise<ServiceResponse<BranchMenuAssignment[]>> =>
    handleRequest(apiClient.get(`${cat(branchId)}/menus`)),

  /** Categories assigned to a specific branch menu. */
  getCategories: (branchId: string, menuId: string): Promise<ServiceResponse<BranchCategoryAssignment[]>> =>
    handleRequest(apiClient.get(`${cMenu(branchId, menuId)}/categories`)),

  /** Items in a category for this branch (includes variant overrides). */
  getItems: (branchId: string, categoryId: string): Promise<ServiceResponse<BranchItemAssignment[]>> =>
    handleRequest(apiClient.get(`${cat(branchId)}/categories/${categoryId}/items`)),

  /** Modifier groups linked to an item, annotated with branch overrides. */
  getModifierGroups: (branchId: string, itemId: string): Promise<ServiceResponse<BranchModifierGroupAssignment[]>> =>
    handleRequest(apiClient.get(`${cat(branchId)}/items/${itemId}/modifier-groups`)),

  /** Modifiers in a modifier group, annotated with branch price + enable overrides. */
  getModifiers: (branchId: string, modifierGroupId: string): Promise<ServiceResponse<BranchModifierAssignment[]>> =>
    handleRequest(apiClient.get(`${cat(branchId)}/modifier-groups/${modifierGroupId}/modifiers`)),

  // ── PATCH: override mutations (enable/disable, price, availability) ───────

  updateMenu: (
    branchId: string, menuId: string,
    data: { isEnabled: boolean; serviceAvailabilities: ServiceAvailability[] }
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.patch(`${cMenu(branchId, menuId)}`, {
      isEnabled: data.isEnabled,
      availabilities: data.serviceAvailabilities.map(toBackendAvail),
    })),

  updateCategory: (
    branchId: string, categoryId: string,
    data: { isEnabled: boolean; serviceAvailabilities: ServiceAvailability[] }
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.patch(`${cat(branchId)}/categories/${categoryId}`, {
      isEnabled: data.isEnabled,
      availabilities: data.serviceAvailabilities.map(toBackendAvail),
    })),

  updateItem: (
    branchId: string, itemId: string,
    data: {
      isEnabled: boolean; isSoldOut: boolean;
      serviceAvailabilities: ServiceAvailability[];
      variants?: { itemVariantId: string; isEnabled: boolean; price?: number }[];
    }
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.patch(`${cat(branchId)}/items/${itemId}`, {
      isEnabled: data.isEnabled,
      isSoldOut: data.isSoldOut,
      availabilities: data.serviceAvailabilities.map(toBackendAvail),
      variants: data.variants,
    })),

  updateModifierGroup: (
    branchId: string, modifierGroupId: string,
    data: { isEnabled: boolean; serviceAvailabilities: ServiceAvailability[] }
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.patch(`${cat(branchId)}/modifier-groups/${modifierGroupId}`, {
      isEnabled: data.isEnabled,
      availabilities: data.serviceAvailabilities.map(toBackendAvail),
    })),

  updateModifier: (
    branchId: string, modifierId: string,
    data: { isEnabled: boolean; price?: number; serviceAvailabilities: ServiceAvailability[] }
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.patch(`${cat(branchId)}/modifiers/${modifierId}`, {
      isEnabled: data.isEnabled,
      price: data.price,
      availabilities: data.serviceAvailabilities.map(toBackendAvail),
    })),

  bulkOverrideItems: (
    branchId: string,
    items: { itemId: string; isEnabled: boolean; isSoldOut?: boolean }[]
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.patch(`${cat(branchId)}/items`, items)),

  bulkOverrideModifierGroups: (
    branchId: string,
    groups: { modifierGroupId: string; isEnabled: boolean }[]
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.patch(`${cat(branchId)}/modifier-groups`, groups)),

  bulkOverrideModifiers: (
    branchId: string,
    modifiers: { modifierId: string; isEnabled: boolean; price?: number; availabilities?: BackendAvailability[] }[]
  ): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.patch(`${cat(branchId)}/modifiers`, modifiers)),

  // ── Assignment mutations ──────────────────────────────────────────────────

  /** Assign a menu to this branch. */
  assignMenu: (branchId: string, menuId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.post(`${cMenu(branchId, menuId)}`)),

  /** Remove a menu from this branch. */
  unassignMenu: (branchId: string, menuId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.delete(`${cMenu(branchId, menuId)}`)),

  /** Add a category to a branch menu. */
  addCategoryToMenu: (branchId: string, menuId: string, categoryId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.post(`${cMenu(branchId, menuId)}/categories/${categoryId}`)),

  /** Remove a category from a branch menu. */
  removeCategoryFromMenu: (branchId: string, menuId: string, categoryId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.delete(`${cMenu(branchId, menuId)}/categories/${categoryId}`)),

  /** Assign an item to the branch. */
  assignItem: (branchId: string, itemId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.post(`${cat(branchId)}/items/${itemId}`)),

  /** Remove an item from this branch. */
  unassignItem: (branchId: string, itemId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.delete(`${cat(branchId)}/items/${itemId}`)),

  /** Assign a modifier group to the branch. */
  assignModifierGroup: (branchId: string, modifierGroupId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.post(`${cat(branchId)}/modifier-groups/${modifierGroupId}`)),

  /** Remove a modifier group from this branch. */
  unassignModifierGroup: (branchId: string, modifierGroupId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.delete(`${cat(branchId)}/modifier-groups/${modifierGroupId}`)),

  /** Assign a modifier to the branch. */
  assignModifier: (branchId: string, modifierId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.post(`${cat(branchId)}/modifiers/${modifierId}`)),

  /** Remove a modifier from this branch. */
  unassignModifier: (branchId: string, modifierId: string): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.delete(`${cat(branchId)}/modifiers/${modifierId}`)),

  // ── Bulk save — all pending changes in one atomic transaction ─────────────

  saveBulk: (branchId: string, payload: BulkSavePayload): Promise<ServiceResponse<void>> =>
    handleRequest(apiClient.post(`${cat(branchId)}/batch`, buildBackendPayload(payload, branchId))),
};

// ─── Frontend bulk-save payload (flat, easy to accumulate in UI state) ────────

export interface BulkSavePayload {
  menusToAdd?:             string[];
  menusToRemove?:          string[];
  menuOverrides?:          Array<{ menuId: string;          isEnabled?: boolean; availabilities?: ServiceAvailability[] }>;
  categoryAssignments?:    Array<{ menuId: string; toAdd?: string[]; toRemove?: string[] }>;
  categoryOverrides?:      Array<{ categoryId: string;      isEnabled?: boolean; availabilities?: ServiceAvailability[] }>;
  itemsToAdd?:             string[];
  itemsToRemove?:          string[];
  itemOverrides?:          Array<{
    itemId: string; isEnabled?: boolean; isSoldOut?: boolean; availabilities?: ServiceAvailability[];
    variants?: Array<{ itemVariantId: string; isEnabled?: boolean; price?: number }>;
  }>;
  modifierGroupsToAdd?:    string[];
  modifierGroupsToRemove?: string[];
  modifierGroupOverrides?: Array<{ modifierGroupId: string; isEnabled?: boolean; availabilities?: ServiceAvailability[] }>;
  modifiersToAdd?:         string[];
  modifiersToRemove?:      string[];
  modifierOverrides?:      Array<{ modifierId: string;      isEnabled?: boolean; branchPrice?: number; availabilities?: ServiceAvailability[] }>;
}

/** Convert flat frontend payload → nested SaveBranchCatalogCommand shape expected by backend POST /batch. */
function buildBackendPayload(p: BulkSavePayload, branchId: string) {
  const avails = (arr?: ServiceAvailability[]) => arr?.map(toBackendAvail);

  return {
    branchId,
    menus: (p.menusToAdd?.length || p.menusToRemove?.length || p.menuOverrides?.length)
      ? {
          toAdd:    p.menusToAdd,
          toRemove: p.menusToRemove,
          overrides: p.menuOverrides?.map(o => ({
            menuId: o.menuId,
            isEnabled: o.isEnabled,
            availabilities: avails(o.availabilities),
          })),
        }
      : undefined,

    categories: (p.categoryAssignments?.length || p.categoryOverrides?.length)
      ? {
          assignments: p.categoryAssignments?.map(a => ({
            menuId:   a.menuId,
            toAdd:    a.toAdd,
            toRemove: a.toRemove,
          })),
          overrides: p.categoryOverrides?.map(o => ({
            categoryId:    o.categoryId,
            isEnabled:     o.isEnabled,
            availabilities: avails(o.availabilities),
          })),
        }
      : undefined,

    items: (p.itemsToAdd?.length || p.itemsToRemove?.length || p.itemOverrides?.length)
      ? {
          toAdd:    p.itemsToAdd,
          toRemove: p.itemsToRemove,
          overrides: p.itemOverrides?.map(o => ({
            itemId:         o.itemId,
            isEnabled:      o.isEnabled,
            isSoldOut:      o.isSoldOut,
            availabilities: avails(o.availabilities),
            variants:       o.variants,
          })),
        }
      : undefined,

    modifierGroups: (p.modifierGroupsToAdd?.length || p.modifierGroupsToRemove?.length || p.modifierGroupOverrides?.length)
      ? {
          toAdd:    p.modifierGroupsToAdd,
          toRemove: p.modifierGroupsToRemove,
          overrides: p.modifierGroupOverrides?.map(o => ({
            modifierGroupId: o.modifierGroupId,
            isEnabled:       o.isEnabled,
            availabilities:  avails(o.availabilities),
          })),
        }
      : undefined,

    modifiers: (p.modifiersToAdd?.length || p.modifiersToRemove?.length || p.modifierOverrides?.length)
      ? {
          toAdd:    p.modifiersToAdd,
          toRemove: p.modifiersToRemove,
          overrides: p.modifierOverrides?.map(o => ({
            modifierId:    o.modifierId,
            isEnabled:     o.isEnabled,
            price:         o.branchPrice,
            availabilities: avails(o.availabilities),
          })),
        }
      : undefined,
  };
}

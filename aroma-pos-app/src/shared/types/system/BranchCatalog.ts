export interface ServiceAvailability {
  dayOfWeek: number; // 0=Sunday … 6=Saturday (C# DayOfWeek)
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface BranchMenuAssignment {
  menuId: string;
  title: string;
  subtitle?: string;
  isAssigned: boolean;
  isEnabled: boolean;
  serviceAvailabilities: ServiceAvailability[];
}

export interface BranchCategoryAssignment {
  categoryId: string;
  name: string;
  description?: string;
  isAssigned: boolean;
  isEnabled: boolean;
  serviceAvailabilities: ServiceAvailability[];
}

export interface BranchItemVariantAssignment {
  itemVariantId: string;
  variantName: string;
  basePrice: number;
  branchPrice?: number;
  isEnabled: boolean;
}

export interface BranchItemAssignment {
  itemId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isAssigned: boolean;
  isEnabled: boolean;
  isSoldOut: boolean;
  serviceAvailabilities: ServiceAvailability[];
  variants: BranchItemVariantAssignment[];
}

export interface BranchModifierGroupAssignment {
  modifierGroupId: string;
  name: string;
  description?: string;
  minSelectCount: number;
  maxSelectCount: number;
  isAssigned: boolean;
  isEnabled: boolean;
  serviceAvailabilities: ServiceAvailability[];
}

export interface BranchModifierAssignment {
  modifierId: string;
  name: string;
  description?: string;
  basePrice: number;
  branchPrice?: number;
  isAssigned: boolean;
  isEnabled: boolean;
  serviceAvailabilities: ServiceAvailability[];
}

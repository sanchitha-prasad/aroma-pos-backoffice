export interface ServiceAvailability {
  dayOfWeek: number; // 0=Sunday … 6=Saturday (C# DayOfWeek)
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface BranchMenuAssignment {
  menuId: string;
  title: string;
  subtitle?: string;
  isEnabled: boolean;
  serviceAvailabilities: ServiceAvailability[];
}

export interface BranchCategoryAssignment {
  categoryId: string;
  name: string;
  description?: string;
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
  isEnabled: boolean;
  serviceAvailabilities: ServiceAvailability[];
}

export interface BranchModifierAssignment {
  modifierId: string;
  name: string;
  description?: string;
  basePrice: number;
  branchPrice?: number;
  isEnabled: boolean;
  serviceAvailabilities: ServiceAvailability[];
}

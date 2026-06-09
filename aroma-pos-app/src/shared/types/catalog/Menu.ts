import { Category } from './Category';

export interface MenuCategory {
  categoryId: string;
  /** Category name resolved by the backend (MenuCategoryResponse.Name). */
  name?: string;
  /** Whether the category is enabled for the menu (branch context). */
  isEnabled?: boolean;
  category?: Category;
}

/** A single time window, serialized as "HH:mm:ss" to match the backend TimeSpan. */
export interface MenuTimePeriod {
  startTime: string;
  endTime: string;
}

/** Weekly availability for one day. `dayOfWeek`: 0=Sunday … 6=Saturday. */
export interface MenuAvailability {
  dayOfWeek: number;
  timePeriods: MenuTimePeriod[];
}

export interface MenuEntity {
  id: string;
  title: string;
  subtitle?: string;
  isActive: boolean;
  categories?: MenuCategory[];
  /** Weekly availability returned by the backend (MenuResponse.ServiceAvailabilities). */
  serviceAvailabilities?: MenuAvailability[];
  createdOnUtc?: string;
  updatedOnUtc?: string;
}

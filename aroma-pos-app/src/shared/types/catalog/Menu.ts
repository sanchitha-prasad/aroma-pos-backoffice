import { Category } from './Category';

export interface MenuCategory {
  categoryId: string;
  /** Category name resolved by the backend (MenuCategoryResponse.Name). */
  name?: string;
  /** Whether the category is enabled for the menu (branch context). */
  isEnabled?: boolean;
  category?: Category;
}

export interface MenuEntity {
  id: string;
  title: string;
  subtitle?: string;
  isActive: boolean;
  categories?: MenuCategory[];
  createdOnUtc?: string;
  updatedOnUtc?: string;
}

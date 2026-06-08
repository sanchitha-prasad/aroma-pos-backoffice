import { Category } from './Category';

export interface MenuCategory {
  categoryId: string;
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

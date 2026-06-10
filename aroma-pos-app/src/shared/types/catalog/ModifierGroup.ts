import { ModifierItem } from './ModifierItem';

export interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  minSelectCount: number;
  maxSelectCount: number;
  isActive: boolean;
  modifierItems: ModifierItem[];
  createdOnUtc?: string;
}

import { ItemVariant } from './ItemVariant';
import { ModifierGroup } from './ModifierGroup';
import { Tax } from './Tax';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  isActive : boolean;
  variants: ItemVariant[];
  modifierGroupIds: string[];
  tagIds?: string[];
  modifierGroups?: ModifierGroup[];
  taxes?: Tax[];
}

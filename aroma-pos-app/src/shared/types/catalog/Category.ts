import { Tax } from './Tax';

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  taxIds?: string[];
  printerIds?: string[];
  kitchenDisplayIds?: string[];
  taxes?: Tax[];
  printers?: any[];
  kitchenDisplays?: any[];
  createdOnUtc?: string;
}

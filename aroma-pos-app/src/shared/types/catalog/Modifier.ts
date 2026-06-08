export interface Modifier {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  createdOnUtc?: string;
}

export interface Tax {
  id: string;
  name: string;
  percentage: number;
  isActive: boolean;
  createdOnUtc?: string;
}

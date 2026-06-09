export type ApplicationType = 'POS' | 'BackOffice';

export interface Permission {
  key: string;
  label: string;
  group: string;
  subGroup?: string;
  description?: string;
  application?: ApplicationType;
}

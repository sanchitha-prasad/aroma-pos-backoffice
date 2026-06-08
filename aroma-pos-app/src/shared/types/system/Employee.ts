import { Role } from './Role';

export interface Employee {
  id: string;
  name: string;
  email: string;
  password?: string;
  loginNumber?: string;
  role: Role;
  status: 'Active' | 'Inactive';
  branchId?: string;
}

import { BranchAddress } from './BranchAddress';
import { BranchAvailability, BranchTimePeriod } from './BranchAvailability';
import { BranchConfiguration } from './BranchConfiguration';

export interface Branch {
  id: string;
  name: string;
  code: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;

  address: BranchAddress;
  configuration: BranchConfiguration;

  availabilities: BranchAvailability[];

  serviceAvailabilities?: {
    dayOfWeek: string;
    timePeriods: BranchTimePeriod[];
  }[];

  createdOnUtc?: string;
  updatedOnUtc?: string;
}

export type CreateBranchDto = Omit<Branch, 'id'>;
export interface BranchTimePeriod {
  startTime: string;
  endTime: string;
}

export interface BranchAvailability {
  dayOfWeek: number;
  timePeriods: BranchTimePeriod[];
}
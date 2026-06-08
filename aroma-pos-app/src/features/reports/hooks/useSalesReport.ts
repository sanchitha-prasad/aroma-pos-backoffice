import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/shared/services/api/client';
import { authStore } from '@/src/shared/services/auth/authStore';
import dayjs from 'dayjs';

export interface SalesReportParams {
    fromDate: dayjs.Dayjs | null;
    toDate: dayjs.Dayjs | null;
}

export const SALES_REPORT_KEY = (branchId: string, fromUtc: string, toUtc: string) =>
    ['reports', 'sales-summary', branchId, fromUtc, toUtc] as const;

export function useSalesReport({ fromDate, toDate }: SalesReportParams) {
    const branchId = authStore.branchId || '00000000-0000-0000-0000-000000000004';
    const fromUtc = fromDate ? fromDate.startOf('day').toISOString() : '';
    const toUtc = toDate ? toDate.endOf('day').toISOString() : '';

    return useQuery<any>({
        queryKey: SALES_REPORT_KEY(branchId, fromUtc, toUtc),
        queryFn: () =>
            apiClient.get<any>('/api/reports/sales-summary', {
                params: { branchId, FromUtc: fromUtc, ToUtc: toUtc },
            }),
        enabled: !!fromDate && !!toDate,
        staleTime: 60_000,
    });
}

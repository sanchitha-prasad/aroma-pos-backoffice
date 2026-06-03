import { apiClient } from '@/src/shared/services/api/client';
import type { PaginatedTickets, TicketFilters } from '../types/ticket.types';

export const ticketsService = {
    getTickets: (filters: TicketFilters): Promise<PaginatedTickets> => {
        const params: Record<string, string | number | undefined> = {
            PaymentStatus: filters.paymentStatus,
            OrderType: filters.orderType,
            Period: filters.period,
            Sort: filters.sort,
            Page: filters.page,
            Limit: filters.limit,
        };

        if (filters.ticketCode) params.TicketCode = filters.ticketCode;
        if (filters.startDate) params.StartDate = filters.startDate;
        if (filters.endDate) params.EndDate = filters.endDate;

        return apiClient.get<PaginatedTickets>('/api/tickets', { params });
    },
};

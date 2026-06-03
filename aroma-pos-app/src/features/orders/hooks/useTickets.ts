import { useQuery } from '@tanstack/react-query';
import { ticketsService } from '../api/tickets.service';
import type { TicketFilters } from '../types/ticket.types';

export const TICKETS_QUERY_KEY = 'tickets';

export function useTickets(filters: TicketFilters) {
    return useQuery({
        queryKey: [TICKETS_QUERY_KEY, filters],
        queryFn: () => ticketsService.getTickets(filters),
        staleTime: 1000 * 60, // 1 min
    });
}

export interface TicketResponse {
    id: string;
    orderId: string;
    ticketCode: number;
    totalAmounnt: number; // backend typo — preserved intentionally
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string; // "Paid" | "Pending" | "PartiallyPaid"
    customerId: string | null;
    customerName: string | null;
    tableId: string | null;
    tableName: string | null;
    orderType: string; // "DineIn" | "Takeaway"
    note: string | null;
    createdOnUtc: string;
}

export interface PaginationMeta {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
}

export interface PaginationLinks {
    first: string;
    last: string;
    next: string;
    prev: string;
    current: string;
}

export interface PaginatedTickets {
    data: TicketResponse[];
    meta: PaginationMeta;
    links: PaginationLinks;
}

// Matches backend PaymentFilter enum
export enum PaymentFilter {
    All = 0,
    Paid = 1,
    Pending = 2,
    PartiallyPaid = 3,
}

// Matches backend OrderTypeFilter enum
export enum OrderTypeFilter {
    None = 0,
    DineIn = 1,
    Takeaway = 2,
}

// Matches backend TicketPeriod enum
export enum TicketPeriod {
    None = 0,
    Today = 1,
    Yesterday = 2,
    Last7Days = 3,
    ThisWeek = 4,
    LastWeek = 5,
    ThisMonth = 6,
}

// Matches backend SortDirection enum
export enum SortDirection {
    Desc = 0,
    Asc = 1,
}

export interface TicketFilters {
    paymentStatus: PaymentFilter;
    orderType: OrderTypeFilter;
    period: TicketPeriod;
    startDate?: string;
    endDate?: string;
    ticketCode?: string;
    sort: SortDirection;
    page: number;
    limit: number;
}

export const DEFAULT_TICKET_FILTERS: TicketFilters = {
    paymentStatus: PaymentFilter.All,
    orderType: OrderTypeFilter.None,
    period: TicketPeriod.None,
    sort: SortDirection.Desc,
    page: 1,
    limit: 500, // large fetch for client-side pagination
};

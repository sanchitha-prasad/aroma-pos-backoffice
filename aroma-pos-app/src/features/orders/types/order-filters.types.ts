export type OrderStatusFilter = 'all' | 'paid' | 'pending' | 'partial';
export type OrderTypeFilter   = 'all' | 'dineIn' | 'takeaway';

export interface OrderListFilters {
    search: string;          // matches orderCode or tableName
    statusFilter: OrderStatusFilter;
    typeFilter: OrderTypeFilter;
}

export const DEFAULT_ORDER_FILTERS: OrderListFilters = {
    search: '',
    statusFilter: 'all',
    typeFilter: 'all',
};

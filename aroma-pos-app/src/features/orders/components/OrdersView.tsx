import React, { useMemo, useState, useCallback } from 'react';
import { Typography } from 'antd';
import OrdersTable from './table/TicketsTable';
import OrderFilters from './filters/OrderFilters';
import OrderDetailDrawer from './detail/OrderDetailDrawer';
import { useOrderList } from '../hooks/useOrderList';
import { DEFAULT_ORDER_FILTERS, type OrderListFilters } from '../types/order-filters.types';
import type { OrderDetailResponse } from '../types/order-detail.types';
import { computeOrderSummary, matchesStatusFilter, ORDER_TYPE } from '../utils/order.helpers';
import type { OrderStatusFilter } from '../types/order-filters.types';

const { Title, Text } = Typography;

const QUICK_STATUS: Record<string, OrderStatusFilter> = {
    all: 'all', paid: 'paid', pending: 'pending', partial: 'partial',
};

const OrdersView: React.FC = () => {
    const [filters, setFilters]               = useState<OrderListFilters>(DEFAULT_ORDER_FILTERS);
    const [activeQuick, setActiveQuick]       = useState('all');
    const [selectedOrder, setSelectedOrder]   = useState<OrderDetailResponse | null>(null);
    const [currentPage, setCurrentPage]       = useState(1);
    const [pageSize, setPageSize]             = useState(10);

    const { data: allOrders = [], isLoading } = useOrderList();

    // Client-side filtering
    const filteredOrders = useMemo(() => allOrders.filter(order => {
        const summary = computeOrderSummary(order);
        if (!matchesStatusFilter(summary, filters.statusFilter)) return false;
        // Compare directly against backend int enum values — no string label involved
        if (filters.typeFilter === 'dineIn'   && order.orderType !== ORDER_TYPE.DineIn)   return false;
        if (filters.typeFilter === 'takeaway' && order.orderType !== ORDER_TYPE.TakeAway) return false;
        if (filters.search) {
            const q = filters.search.toLowerCase();
            if (!String(order.orderCode).includes(q) &&
                !(order.tableName ?? '').toLowerCase().includes(q) &&
                !(order.tickets?.[0]?.customerName ?? '').toLowerCase().includes(q)) return false;
        }
        return true;
    }), [allOrders, filters]);

    // Badge counts
    const counts = useMemo(() => {
        let paid = 0, pending = 0, partial = 0;
        allOrders.forEach(o => {
            const s = computeOrderSummary(o);
            if (s.paymentStatus === 2) paid++;
            else if (s.paymentStatus === 1) pending++;
            else partial++;
        });
        return { all: allOrders.length, paid, pending, partial };
    }, [allOrders]);

    const quickFilters = [
        { key: 'all',     label: 'All',           count: counts.all },
        { key: 'paid',    label: 'Paid',           count: counts.paid },
        { key: 'pending', label: 'Pending',        count: counts.pending },
        { key: 'partial', label: 'Partially Paid', count: counts.partial },
    ];

    const handleQuickFilter = useCallback((key: string) => {
        setActiveQuick(key);
        setFilters(prev => ({ ...prev, statusFilter: QUICK_STATUS[key] ?? 'all' }));
        setCurrentPage(1);
    }, []);

    const handleFilterChange = useCallback((patch: Partial<OrderListFilters>) => {
        setFilters(prev => ({ ...prev, ...patch }));
        setCurrentPage(1);
    }, []);

    const handleClear = useCallback(() => {
        setFilters(DEFAULT_ORDER_FILTERS);
        setActiveQuick('all');
        setCurrentPage(1);
    }, []);

    return (
        <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
            <div style={{ flexShrink: 0 }}>
                <Title level={2} style={{ margin: 0 }}>Orders</Title>
                <Text type="secondary">
                    {isLoading ? 'Loading…' : `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`}
                </Text>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
                <OrdersTable
                    data={filteredOrders}
                    isLoading={isLoading}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                    onViewDetail={setSelectedOrder}
                    quickFilters={quickFilters}
                    activeFilterKey={activeQuick}
                    onFilterChange={handleQuickFilter}
                    filterBar={
                        <OrderFilters
                            filters={filters}
                            onChange={handleFilterChange}
                            onClear={handleClear}
                        />
                    }
                />
            </div>

            {/* Drawer receives already-loaded order — no second API call */}
            <OrderDetailDrawer
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
        </div>
    );
};

export default OrdersView;

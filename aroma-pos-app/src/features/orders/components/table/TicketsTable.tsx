import React, { useMemo } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { Skeleton } from 'antd';
import { RichTable } from '@/src/shared/components/rich-table';
import { buildOrderColumns } from './columns';
import type { OrderDetailResponse } from '../../types/order-detail.types';
import { useCurrency } from '@/src/shared/context/CurrencyContext';

const SKELETON_DATA = Array.from({ length: 10 }, (_, i) => ({ id: `sk-${i}` }) as unknown as OrderDetailResponse);

const SKELETON_COLUMNS: ColumnsType<OrderDetailResponse> = [
    { key: 'order',    width: 120, render: () => <Skeleton.Input active size="small" style={{ width: 80 }} /> },
    { key: 'identity', width: 190, render: () => <Skeleton.Input active size="small" style={{ width: 130 }} /> },
    { key: 'tickets',  width: 90,  render: () => <Skeleton.Avatar active size="small" /> },
    { key: 'items',    width: 75,  render: () => <Skeleton.Input active size="small" style={{ width: 35 }} /> },
    { key: 'amount',   width: 150, render: () => <Skeleton.Input active size="small" style={{ width: 90 }} /> },
    { key: 'status',   width: 130, render: () => <Skeleton.Input active size="small" style={{ width: 80 }} /> },
    { key: 'actions',  width: 100, render: () => <Skeleton.Button active size="small" style={{ width: 64 }} /> },
];

interface OrdersTableProps {
    data: OrderDetailResponse[];
    isLoading: boolean;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onViewDetail: (order: OrderDetailResponse) => void;
    quickFilters?: { key: string; label: string; count?: number }[];
    activeFilterKey?: string;
    onFilterChange?: (key: string) => void;
    filterBar?: React.ReactNode;
    toolbarRight?: React.ReactNode;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
    data, isLoading,
    currentPage, pageSize, onPageChange, onPageSizeChange,
    onViewDetail,
    quickFilters, activeFilterKey, onFilterChange,
    filterBar, toolbarRight,
}) => {
    const { currencySymbol } = useCurrency();
    const columns = useMemo(() => buildOrderColumns(onViewDetail, currencySymbol), [onViewDetail, currencySymbol]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return data.slice(start, start + pageSize);
    }, [data, currentPage, pageSize]);

    const shared = {
        quickFilters, activeFilterKey, onFilterChange,
        filterBar, toolbarRight,
        totalLabel: 'orders' as const,
        scrollY: 'calc(100vh - 340px)',
    };

    if (isLoading) {
        return (
            <RichTable<OrderDetailResponse>
                data={SKELETON_DATA}
                columns={SKELETON_COLUMNS}
                rowKey="id"
                currentPage={1} pageSize={10} totalItems={0}
                onPageChange={() => {}} onPageSizeChange={() => {}}
                {...shared}
            />
        );
    }

    return (
        <RichTable<OrderDetailResponse>
            data={paginatedData}
            columns={columns}
            rowKey="id"
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={data.length}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            {...shared}
        />
    );
};

export default OrdersTable;

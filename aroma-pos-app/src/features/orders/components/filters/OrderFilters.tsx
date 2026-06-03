import React from 'react';
import { Input, Select, Space, Button } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import type { OrderListFilters, OrderTypeFilter } from '../../types/order-filters.types';
import { DEFAULT_ORDER_FILTERS } from '../../types/order-filters.types';

interface OrderFiltersProps {
    filters: OrderListFilters;
    onChange: (patch: Partial<OrderListFilters>) => void;
    onClear?: () => void;
}

const TYPE_OPTIONS: { value: OrderTypeFilter; label: string }[] = [
    { value: 'all',      label: 'All Types' },
    { value: 'dineIn',   label: 'Dine In' },
    { value: 'takeaway', label: 'Takeaway' },
];

const isDirty = (f: OrderListFilters) =>
    f.search !== '' ||
    f.statusFilter !== 'all' ||
    f.typeFilter !== 'all';

const OrderFilters: React.FC<OrderFiltersProps> = ({ filters, onChange, onClear }) => (
    <Space wrap size={8}>
        <Input
            placeholder="Search order # or table…"
            prefix={<SearchOutlined style={{ color: '#aaa' }} />}
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            style={{ width: 220, borderRadius: 8 }}
            allowClear
        />
        <Select
            value={filters.typeFilter}
            options={TYPE_OPTIONS}
            onChange={val => onChange({ typeFilter: val })}
            style={{ width: 140 }}
        />
        {onClear && isDirty(filters) && (
            <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={onClear}
                style={{ color: '#999' }}
            >
                Clear
            </Button>
        )}
    </Space>
);

export default OrderFilters;

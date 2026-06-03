import React from 'react';
import { Table, Tag, Typography, theme } from 'antd';
import { useCurrency } from '@/src/shared/context/CurrencyContext';
import type { ColumnsType } from 'antd/es/table';
import type { TicketItemDetailResponse } from '../../types/order-detail.types';

const { Text } = Typography;

interface TicketItemsTableProps {
    items: TicketItemDetailResponse[];
}

const TicketItemsTable: React.FC<TicketItemsTableProps> = ({ items: rawItems }) => {
    const items = rawItems ?? [];
    const { token } = theme.useToken();
    const { currencySymbol } = useCurrency();

    const columns: ColumnsType<TicketItemDetailResponse> = [
        {
            title: 'Item',
            key: 'name',
            render: (_: unknown, item: TicketItemDetailResponse) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    {item.variant && (
                        <Tag color="purple" style={{ fontSize: 10, margin: '2px 0 0' }}>
                            {item.variant.variantName}
                        </Tag>
                    )}
                    {(item.modifiers ?? []).length > 0 && (
                        <div style={{ fontSize: 11, color: token.colorTextSecondary, marginTop: 2 }}>
                            {(item.modifiers ?? []).map(m => `+${m.name}`).join(' · ')}
                        </div>
                    )}
                    {item.note && (
                        <div style={{ fontSize: 11, color: token.colorTextTertiary, fontStyle: 'italic' }}>
                            Note: {item.note}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'qty',
            width: 55,
            align: 'center',
        },
        {
            title: 'Portion',
            dataIndex: 'portion',
            key: 'portion',
            width: 65,
            align: 'center',
            render: (val: number) => val < 1 ? `${(val * 100).toFixed(0)}%` : '—',
        },
        {
            title: 'Unit Price',
            dataIndex: 'price',
            key: 'unitPrice',
            width: 90,
            align: 'right',
            render: (val: number) => `${currencySymbol} ${val.toFixed(2)}`,
        },
        {
            title: 'Total',
            key: 'lineTotal',
            width: 90,
            align: 'right',
            render: (_: unknown, item: TicketItemDetailResponse) => {
                const modTotal = (item.modifiers ?? []).reduce((acc, m) => acc + (m.price ?? 0) * (m.quantity ?? 1), 0);
                const total = (item.price + modTotal) * item.quantity * (item.portion || 1);
                return <Text strong>{currencySymbol} {total.toFixed(2)}</Text>;
            },
        },
    ];

    return (
        <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
        />
    );
};

export default TicketItemsTable;

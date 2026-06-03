import React from 'react';
import { Button, Tag, Typography, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, ShopOutlined, UserOutlined, CarOutlined, FileTextOutlined } from '@ant-design/icons';
import StatusDot from '@/src/shared/components/rich-table/StatusDot';
import type { OrderDetailResponse } from '../../types/order-detail.types';
import { computeOrderSummary, getOrderTypeLabel, ORDER_TYPE } from '../../utils/order.helpers';

const { Text } = Typography;

type StatusVariant = 'success' | 'warning' | 'processing';

const STATUS_MAP: Record<string, { variant: StatusVariant; label: string }> = {
    Paid:          { variant: 'success',    label: 'Paid' },
    Pending:       { variant: 'warning',    label: 'Pending' },
    PartiallyPaid: { variant: 'processing', label: 'Partial' },
};

export function buildOrderColumns(
    onViewDetail: (order: OrderDetailResponse) => void,
): ColumnsType<OrderDetailResponse> {
    return [
        {
            title: 'Order',
            key: 'orderCode',
            width: 120,
            render: (_: unknown, order: OrderDetailResponse) => (
                <div>
                    <Text strong style={{ fontFamily: 'monospace', fontSize: 14 }}>
                        #{order.orderCode}
                    </Text>
                    <div style={{ marginTop: 3 }}>
                        <Tag
                            icon={order.orderType === ORDER_TYPE.DineIn ? <ShopOutlined /> : <CarOutlined />}
                            color={order.orderType === ORDER_TYPE.DineIn ? 'blue' : 'purple'}
                            style={{ fontSize: 10, margin: 0, padding: '0 5px' }}
                        >
                            {getOrderTypeLabel(order.orderType)}
                        </Tag>
                    </div>
                </div>
            ),
        },
        {
            title: 'Table / Customer',
            key: 'identity',
            width: 190,
            render: (_: unknown, order: OrderDetailResponse) => {
                const customerName = order.tickets?.[0]?.customerName;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {order.tableName ? (
                            <Tag icon={<ShopOutlined />} color="blue" style={{ width: 'fit-content', margin: 0 }}>
                                {order.tableName}
                            </Tag>
                        ) : (
                            <Tag color="default" style={{ width: 'fit-content', margin: 0 }}>Walk-in</Tag>
                        )}
                        {customerName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: '#6132C015',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <UserOutlined style={{ fontSize: 10, color: '#6132C0' }} />
                                </span>
                                <Text style={{ fontSize: 12 }}>{customerName}</Text>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Tickets',
            key: 'tickets',
            width: 90,
            align: 'center' as const,
            render: (_: unknown, order: OrderDetailResponse) => (
                <Badge count={order.tickets?.length ?? 0} style={{ background: '#6132C0' }} showZero>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: '#6132C010',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FileTextOutlined style={{ color: '#6132C0', fontSize: 14 }} />
                    </div>
                </Badge>
            ),
        },
        {
            title: 'Items',
            key: 'items',
            width: 75,
            align: 'center' as const,
            render: (_: unknown, order: OrderDetailResponse) => {
                const total = (order.tickets ?? []).reduce(
                    (a, t) => a + (t.items ?? []).reduce((b, i) => b + (i.quantity ?? 1), 0), 0,
                );
                return <Text type="secondary">{total}</Text>;
            },
        },
        {
            title: 'Amount',
            key: 'amount',
            width: 150,
            align: 'right' as const,
            render: (_: unknown, order: OrderDetailResponse) => {
                const s = computeOrderSummary(order);
                return (
                    <div style={{ textAlign: 'right' }}>
                        <Text strong style={{ fontSize: 15 }}>${s.totalAmount.toFixed(2)}</Text>
                        {s.paidAmount > 0 && (
                            <div><Text type="success" style={{ fontSize: 11 }}>Paid ${s.paidAmount.toFixed(2)}</Text></div>
                        )}
                        {s.balance > 0.001 && (
                            <div><Text type="danger" style={{ fontSize: 11 }}>Due ${s.balance.toFixed(2)}</Text></div>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            width: 130,
            render: (_: unknown, order: OrderDetailResponse) => {
                const s = computeOrderSummary(order);
                const cfg = STATUS_MAP[s.paymentStatusLabel];
                return cfg
                    ? <StatusDot variant={cfg.variant} label={cfg.label} pulse={s.paymentStatus === 1} />
                    : null;
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            fixed: 'right' as const,
            render: (_: unknown, order: OrderDetailResponse) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(e) => { e.stopPropagation(); onViewDetail(order); }}
                    style={{ background: '#1a1a2e', borderColor: '#1a1a2e', borderRadius: 6, fontWeight: 500 }}
                >
                    View
                </Button>
            ),
        },
    ];
}

import React from 'react';
import { Drawer, Tabs, Tag, Typography, Space, Descriptions } from 'antd';
import { FileTextOutlined, ShopOutlined, CarOutlined } from '@ant-design/icons';
import TicketDetailPanel from './TicketDetailPanel';
import type { OrderDetailResponse } from '../../types/order-detail.types';
import { computeOrderSummary, getOrderTypeLabel, ORDER_TYPE } from '../../utils/order.helpers';
import StatusDot from '@/src/shared/components/rich-table/StatusDot';
import { useCurrency } from '@/src/shared/context/CurrencyContext';

const { Text } = Typography;

const STATUS_VARIANT = { 1: 'warning', 2: 'success', 3: 'processing', 4: 'default'  } as const;
const STATUS_LABEL   = { 1: 'Pending', 2: 'Paid',    3: 'Partial',   4: 'Refunded' } as const;

interface OrderDetailDrawerProps {
    order: OrderDetailResponse | null;
    onClose: () => void;
}

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ order, onClose }) => {
    const { currencySymbol } = useCurrency();
    const summary = order ? computeOrderSummary(order) : null;
    const tickets = order?.tickets ?? [];

    const drawerTitle = order ? (
        <Space size={8}>
            <Text strong style={{ fontSize: 16 }}>Order #{order.orderCode}</Text>
            {order.tableName
                ? <Tag color="blue" icon={<ShopOutlined />}>{order.tableName}</Tag>
                : <Tag>Walk-in</Tag>}
            <Tag
                color={order.orderType === ORDER_TYPE.DineIn ? 'blue' : 'purple'}
                icon={order.orderType === ORDER_TYPE.DineIn ? <ShopOutlined /> : <CarOutlined />}
            >
                {getOrderTypeLabel(order.orderType)}
            </Tag>
        </Space>
    ) : 'Order Details';

    return (
        <Drawer
            title={drawerTitle}
            size="large"
            open={!!order}
            onClose={onClose}
            destroyOnHidden
            extra={
                summary && (
                    <Space size={16}>
                        <div style={{ textAlign: 'right' }}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Total</Text>
                            <Text strong style={{ fontSize: 16 }}>{currencySymbol} {summary.totalAmount.toFixed(2)}</Text>
                        </div>
                        <StatusDot
                            variant={STATUS_VARIANT[summary.paymentStatus]}
                            label={STATUS_LABEL[summary.paymentStatus]}
                            pulse={summary.paymentStatus === 1}
                        />
                    </Space>
                )
            }
        >
            {order && (
                <>
                    {/* Order summary strip */}
                    <Descriptions
                        size="small"
                        column={4}
                        style={{ marginBottom: 20 }}
                        styles={{ label: { fontWeight: 600 } }}
                        items={[
                            { key: 'tickets', label: 'Tickets', children: summary?.ticketCount },
                            { key: 'items',   label: 'Items',   children: summary?.itemCount },
                            {
                                key: 'paid', label: 'Paid',
                                children: <Text type="success">{currencySymbol} {summary?.paidAmount.toFixed(2)}</Text>,
                            },
                            {
                                key: 'balance',
                                label: (summary?.balance ?? 0) > 0 ? 'Balance Due' : 'Change',
                                children: (
                                    <Text type={(summary?.balance ?? 0) > 0 ? 'danger' : 'secondary'}>
                                        {currencySymbol} {Math.abs(summary?.balance ?? 0).toFixed(2)}
                                    </Text>
                                ),
                            },
                        ]}
                    />

                    {/* One tab per ticket */}
                    {tickets.length === 0 ? (
                        <Text type="secondary">No tickets on this order.</Text>
                    ) : (
                        <Tabs
                            defaultActiveKey="0"
                            type="card"
                            items={tickets.map((ticket, i) => ({
                                key: i.toString(),
                                label: (
                                    <Space size={4}>
                                        <FileTextOutlined />
                                        <span>Ticket #{ticket.ticketCode}</span>
                                        {ticket.tableName && (
                                            <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>
                                                {ticket.tableName}
                                            </Tag>
                                        )}
                                    </Space>
                                ),
                                children: <TicketDetailPanel ticket={ticket} />,
                            }))}
                        />
                    )}
                </>
            )}
        </Drawer>
    );
};

export default OrderDetailDrawer;

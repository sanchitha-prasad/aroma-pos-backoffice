import React, { useState } from 'react';
import { Table, Button, Tag, Typography, Alert, Card, Flex } from 'antd';
import { useCurrency } from '../../../shared/context/CurrencyContext';
import type { TableColumnsType } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { Order } from '../../../shared/types';
import { OrderType } from '../../../shared/enums';
import OrderDetailDrawer from './OrderDetailDrawer';
import OrdersTableSkeleton from './OrdersTableSkeleton';

interface OrdersTableProps {
    orders: Order[];
    isLoading: boolean;
    isError: boolean;
    onRefresh: () => void;
}

const { Title, Text } = Typography;

// Accounts for: layout navbar (~64px) + page header (~80px) + table col header (~55px) + pagination (~56px) + page padding (~48px)
const TABLE_SCROLL_Y = 'calc(100vh - 345px)';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

function getOrderTotal(order: Order): number {
    return order.tickets.reduce(
        (acc, ticket) =>
            acc +
            ticket.items.reduce((tAcc, item) => {
                const modTotal = item.modifiers.reduce((mAcc, m) => mAcc + m.price, 0);
                return tAcc + (item.price + modTotal) * item.quantity * item.portion;
            }, 0),
        0
    );
}

function getOverallPaymentStatus(order: Order): number {
    const statuses = order.tickets.map((t) => t.paymentStatus);
    if (statuses.every((s) => s === 2)) return 2;
    if (statuses.some((s) => s === 3 || s === 2)) return 3;
    return 1;
}

function PaymentStatusTag({ status }: { status: number }) {
    switch (status) {
        case 2:  return <Tag color="green">Paid</Tag>;
        case 3:  return <Tag color="gold">Partial</Tag>;
        default: return <Tag color="orange">Pending</Tag>;
    }
}

function OrderTypeTag({ type }: { type: OrderType }) {
    switch (type) {
        case OrderType.DineIn:   return <Tag color="blue">Dine In</Tag>;
        case OrderType.TakeAway: return <Tag color="purple">Takeaway</Tag>;
        default:                 return <Tag>Unknown</Tag>;
    }
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, isLoading, isError, onRefresh }) => {
    const { currencySymbol } = useCurrency();
    const [pageSize, setPageSize]       = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [drawerOpen, setDrawerOpen]   = useState(false);

    const openDrawer = (order: Order) => {
        setSelectedOrder(order);
        setDrawerOpen(true);
    };

    const columns: TableColumnsType<Order> = [
        {
            title: 'Order #',
            key: 'orderCode',
            width: 100,
            render: (_: unknown, record: Order) => <Text strong>#{record.orderCode}</Text>,
        },
        {
            title: 'Table',
            key: 'tableName',
            width: 120,
            render: (_: unknown, record: Order) =>
                record.tableName
                    ? <Tag color="cyan">{record.tableName}</Tag>
                    : <Text type="secondary">—</Text>,
        },
        {
            title: 'Type',
            dataIndex: 'orderType',
            key: 'orderType',
            width: 110,
            render: (type: OrderType) => <OrderTypeTag type={type} />,
        },
        {
            title: 'Status',
            key: 'paymentStatus',
            width: 120,
            render: (_: unknown, record: Order) => (
                <PaymentStatusTag status={getOverallPaymentStatus(record)} />
            ),
        },
        {
            title: 'Tickets',
            key: 'tickets',
            width: 80,
            align: 'center',
            render: (_: unknown, record: Order) => record.tickets.length,
        },
        {
            title: 'Total Amount',
            key: 'amount',
            width: 130,
            align: 'right',
            render: (_: unknown, record: Order) => (
                <Text strong>{currencySymbol} {getOrderTotal(record).toFixed(2)}</Text>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            fixed: 'right',
            render: (_: unknown, record: Order) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => openDrawer(record)}
                >
                    View Details
                </Button>
            ),
        },
    ];

    return (
        <Flex
            vertical
            style={{ height: '100vh', overflow: 'hidden', padding: 24, boxSizing: 'border-box' }}
            gap={16}
        >
            {/* Page header */}
            <Flex justify="space-between" align="flex-end" style={{ flexShrink: 0 }}>
                <Flex vertical gap={2}>
                    <Title level={2} style={{ margin: 0 }}>Order Management</Title>
                    <Text type="secondary">Active orders for this branch.</Text>
                </Flex>
                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={isLoading}>
                    Refresh
                </Button>
            </Flex>

            {isError && (
                <Alert
                    type="error"
                    message="Failed to load orders. Check your connection and try again."
                    showIcon
                    style={{ flexShrink: 0 }}
                />
            )}

            {/* Table card — flex: 1 so it fills remaining height */}
            <Card
                style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
                styles={{ body: { padding: 0, height: '100%' } }}
            >
                {isLoading ? (
                    <OrdersTableSkeleton />
                ) : (
                    <Table<Order>
                        dataSource={orders}
                        columns={columns}
                        rowKey="id"
                        scroll={{ x: 'max-content', y: TABLE_SCROLL_Y }}
                        pagination={{
                            current: currentPage,
                            pageSize,
                            total: orders.length,
                            showTotal: (total, range) =>
                                `${range[0]}–${range[1]} of ${total} orders`,
                            pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
                            showSizeChanger: true,
                            onChange: (page, size) => {
                                setCurrentPage(page);
                                setPageSize(size);
                            },
                            style: { padding: '12px 16px', margin: 0 },
                        }}
                        size="middle"
                    />
                )}
            </Card>

            <OrderDetailDrawer
                order={selectedOrder}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            />
        </Flex>
    );
};

export default OrdersTable;

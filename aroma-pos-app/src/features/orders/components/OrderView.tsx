import React, { useState } from 'react';
import { Table, Button, Space, Tag, Typography, theme, Drawer, Tabs, List, Divider, Descriptions } from 'antd';
import { EyeOutlined, ShoppingCartOutlined, CreditCardOutlined, FileTextOutlined, UserOutlined } from '@ant-design/icons';
import { Order, Ticket, TicketItem } from '../../../shared/types';
import Card from 'antd/es/card/Card';
import { OrderType } from '@/src/shared/enums';

interface OrderViewProps {
    orders: Order[];
}

const { Title, Text } = Typography;

const OrderView: React.FC<OrderViewProps> = ({ orders }) => {
    const { token } = theme.useToken();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const showDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDrawerOpen(true);
    };

    const getOrderTotal = (order: Order) => {
        return order.tickets.reduce((acc, ticket) => {
            return acc + ticket.items.reduce((tAcc, item) => tAcc + (item.price * item.quantity), 0);
        }, 0);
    };

    const getPaymentStatus = (status: number) => {
        switch (status) {
            case 3: return <Tag color="yellow">Partially Paid</Tag>;
            case 2: return <Tag color="green">Paid</Tag>;
            case 1: return <Tag color="orange">Pending</Tag>;
            default: return <Tag color="default">Unknown</Tag>;
        }
    };

    const columns = [
        {
            title: 'Order #',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
            render: (text: number) => <strong>#{text}</strong>
        },
        {
            title: 'Table',
            dataIndex: 'tableName',
            key: 'tableName',
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Type',
            dataIndex: 'orderType',
            key: 'orderType',
            render: (type?: OrderType) => {
                    switch (type) {
                        case OrderType.DineIn:
                            return <Tag>Dine In</Tag>;

                        case OrderType.TakeAway:
                            return <Tag>Takeaway</Tag>;

                        default:
                            return <Tag color="default">Unknown</Tag>;
                    }
            }
        },
        {
            title: 'Total Tickets',
            key: 'tickets',
            render: (_: any, record: Order) => record.tickets.length
        },
        {
            title: 'Total Amount',
            key: 'amount',
            render: (_: any, record: Order) => `$${getOrderTotal(record).toFixed(2)}`
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Order) => (
                <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => showDetails(record)}>
                    View Details
                </Button>
            )
        }
    ];

    const renderTicketDetails = (ticket: Ticket) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <Title level={5}>Order Items</Title>
                <Text>Ticket Number #{ticket.ticketCode}</Text>
                <Table
                    dataSource={ticket.items}
                    rowKey="id"
                    pagination={false}
                    columns={[
                        {
                            title: 'Item',
                            dataIndex: 'name',
                            key: 'name',
                            render: (text: string, item: TicketItem) => (
                                <div>
                                    <div style={{ fontWeight: 500 }}>{text}</div>
                                    {item.variant && <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>{item.variant.variantName}</Tag>}
                                    {item.modifiers.length > 0 && (
                                        <div style={{ fontSize: 11, color: token.colorTextSecondary }}>
                                            {item.modifiers.map(m => `+ ${m.name}`).join(', ')}
                                        </div>
                                    )}
                                </div>
                            )
                        },
                        { title: 'Qty', dataIndex: 'quantity', key: 'qty', width: 60 },
                        {
                            title: 'Price',
                            key: 'price',
                            align: 'right',
                            render: (_: any, item: TicketItem) => {
                                const modTotal = item.modifiers.reduce((acc, m) => acc + m.price, 0);
                                const total = ((item.price + modTotal) * item.quantity) * item.portion;
                                return `$${total.toFixed(2)}`;
                            }
                        }
                    ]}
                />
            </div>

            <div>
                <Title level={5}>Payments</Title>
                {ticket.payments.length > 0 ? (
                    <List
                        dataSource={ticket.payments}
                        renderItem={payment => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<CreditCardOutlined style={{ fontSize: 24, color: token.colorPrimary }} />}
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>Payment ID:</span>
                                            <Tag color="gray" style={{ fontSize: 10, margin: 0 }}>
                                                {payment.id}
                                            </Tag>
                                        </div>
                                    }
                                    description={payment.paymentType === 0 ? "Cash" : "Card"}
                                />
                                <div style={{ fontWeight: 600 }}>${payment.amount.toFixed(2)}</div>
                            </List.Item>
                        )}
                    />
                ) : (
                    <Text type="secondary">No payments recorded.</Text>
                )}
            </div>

            <Card size="small" style={{ background: token.colorFillAlter }}>
                {(() => {
                    let totalTax = 0;
                    const subtotal = ticket.items.reduce((acc, item) => {
                        const modTotal = item.modifiers.reduce((mAcc, m) => mAcc + m.price, 0);
                        const itemSubtotal = ((item.price + modTotal) * item.quantity) * item.portion;

                        if (item.taxes && item.taxes.length > 0) {
                            const itemTax = item.taxes.reduce((tAcc, tax) => {
                                return tax.isActive ? tAcc + (itemSubtotal * (tax.percentage / 100)) : tAcc;
                            }, 0);
                            totalTax += itemTax;
                        }
                        return acc + itemSubtotal;
                    }, 0);

                    const grandTotal = subtotal + totalTax;

                    // 1. Calculate Total Paid
                    const totalPaid = ticket.payments.reduce((acc, p) => acc + p.amount, 0);

                    // 2. Calculate Balance (Remaining)
                    const balance = grandTotal - totalPaid;

                    return (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text>Subtotal:</Text>
                                <Text strong>${subtotal.toFixed(2)}</Text>
                            </div>

                            {totalTax > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text>Tax:</Text>
                                    <Text strong>${totalTax.toFixed(2)}</Text>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                                <Text strong>Total:</Text>
                                <Text strong>${grandTotal.toFixed(2)}</Text>
                            </div>

                            <Divider style={{ margin: '8px 0' }} />

                            {/* Paid Amount Display */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text type="secondary">Paid:</Text>
                                <Text strong type="success">${totalPaid.toFixed(2)}</Text>
                            </div>

                            {/* Balance Display */}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong>{balance <= 0 ? "Change:" : "Balance Due:"}</Text>
                                <Text strong style={{ color: balance > 0 ? token.colorError : token.colorSuccess }}>
                                    ${Math.abs(balance).toFixed(2)}
                                </Text>
                            </div>
                        </>
                    );
                })()}

                <div style={{ marginTop: 8, textAlign: 'right' }}>
                    {getPaymentStatus(ticket.paymentStatus)}
                </div>
            </Card>
        </div>
    );

    return (
        <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Order Management</Title>
                <Text type="secondary">View and manage orders, tickets, and payments.</Text>
            </div>

            <div style={{ background: token.colorBgContainer, borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}`, overflow: 'hidden' }}>
                <Table
                    className="custom-table"
                    dataSource={orders}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </div>

            <Drawer
                title={selectedOrder ? `Order #${selectedOrder.orderNumber}` : 'Order Details'}
                width={600}
                onClose={() => setIsDrawerOpen(false)}
                open={isDrawerOpen}
            >
                {selectedOrder && (
                    <Tabs
                        defaultActiveKey="0"
                        items={selectedOrder.tickets.map((ticket, index) => ({
                            key: index.toString(),
                            label: <span><FileTextOutlined /> Ticket #{ticket.ticketNumber}</span>,
                            children: renderTicketDetails(ticket)
                        }))}
                    />
                )}
            </Drawer>
        </div>
    );
};

export default OrderView;
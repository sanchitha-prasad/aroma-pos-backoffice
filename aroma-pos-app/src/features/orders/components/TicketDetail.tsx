import React from 'react';
import { Table, Tag, Typography, List, Divider, Descriptions, Card, Space, Flex, theme } from 'antd';
import { CreditCardOutlined, DollarOutlined } from '@ant-design/icons';
import { Ticket, TicketItem } from '../../../shared/types';
import { useCurrency } from '../../../shared/context/CurrencyContext';

interface TicketDetailProps {
    ticket: Ticket;
}

const { Title, Text } = Typography;

function getPaymentStatusTag(status: number) {
    switch (status) {
        case 3:  return <Tag color="gold">Partially Paid</Tag>;
        case 2:  return <Tag color="green">Paid</Tag>;
        case 1:  return <Tag color="orange">Pending</Tag>;
        default: return <Tag>Unknown</Tag>;
    }
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket }) => {
    const { token } = theme.useToken();
    const { currencySymbol } = useCurrency();

    const itemColumns = [
        {
            title: 'Item',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, item: TicketItem) => (
                <Space direction="vertical" size={2}>
                    <Text strong>{text}</Text>
                    {item.variant && (
                        <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>
                            {item.variant.variantName}
                        </Tag>
                    )}
                    {item.modifiers.length > 0 && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {item.modifiers.map((m) => `+ ${m.name}`).join(', ')}
                        </Text>
                    )}
                    {item.note && (
                        <Text type="secondary" italic style={{ fontSize: 11 }}>{item.note}</Text>
                    )}
                </Space>
            ),
        },
        { title: 'Qty', dataIndex: 'quantity', key: 'qty', width: 60 },
        {
            title: 'Price',
            key: 'price',
            align: 'right' as const,
            render: (_: unknown, item: TicketItem) => {
                const modTotal = item.modifiers.reduce((acc, m) => acc + m.price, 0);
                const total    = (item.price + modTotal) * item.quantity * item.portionNumerator / item.portionDenominator;
                return <Text strong>{currencySymbol} {total.toFixed(2)}</Text>;
            },
        },
    ];

    const subtotal = ticket.items.reduce((acc, item) => {
        const modTotal = item.modifiers.reduce((mAcc, m) => mAcc + m.price, 0);
        return acc + (item.price + modTotal) * item.quantity * item.portionNumerator / item.portionDenominator;
    }, 0);

    const totalTax = ticket.items.reduce((acc, item) => {
        const modTotal  = item.modifiers.reduce((mAcc, m) => mAcc + m.price, 0);
        const itemBase  = (item.price + modTotal) * item.quantity * item.portionNumerator / item.portionDenominator;
        const itemTax   = (item.taxes ?? []).reduce(
            (tAcc, tax) => (tax.isActive ? tAcc + itemBase * (tax.percentage / 100) : tAcc),
            0
        );
        return acc + itemTax;
    }, 0);

    const serviceChargeAmount =
        ticket.serviceChargePercentage > 0
            ? subtotal * (ticket.serviceChargePercentage / 100)
            : 0;

    const grandTotal = subtotal + totalTax + serviceChargeAmount;
    const totalPaid  = ticket.payments
        .filter((p) => !p.isVoided)
        .reduce((acc, p) => acc + p.totalAmount, 0);
    const balance = grandTotal - totalPaid;

    // Build Descriptions items dynamically so optional rows only appear when non-zero
    const summaryItems = [
        { key: 'subtotal', label: 'Subtotal', children: `${currencySymbol}${subtotal.toFixed(2)}` },
        ...(totalTax > 0
            ? [{ key: 'tax', label: 'Tax', children: `${currencySymbol}${totalTax.toFixed(2)}` }]
            : []),
        ...(serviceChargeAmount > 0
            ? [{
                key: 'sc',
                label: `Service Charge (${ticket.serviceChargePercentage}%)`,
                children: `${currencySymbol}${serviceChargeAmount.toFixed(2)}`,
            }]
            : []),
        {
            key: 'total',
            label: <Text strong>Total</Text>,
            children: <Text strong>{currencySymbol}{grandTotal.toFixed(2)}</Text>,
        },
    ];

    const paymentSummaryItems = [
        {
            key: 'paid',
            label: 'Paid',
            children: <Text type="success" strong>{currencySymbol}{totalPaid.toFixed(2)}</Text>,
        },
        {
            key: 'balance',
            label: <Text strong>{balance <= 0 ? 'Change' : 'Balance Due'}</Text>,
            children: (
                <Text strong style={{ color: balance > 0 ? token.colorError : token.colorSuccess }}>
                    {currencySymbol}{Math.abs(balance).toFixed(2)}
                </Text>
            ),
        },
    ];

    return (
        <Flex vertical gap={24}>
            {/* Items section */}
            <div>
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <Title level={5} style={{ margin: 0 }}>Order Items</Title>
                    <Space>
                        <Text type="secondary">Ticket #{ticket.ticketCode}</Text>
                        {ticket.customerName && (
                            <Tag icon={<DollarOutlined />}>{ticket.customerName}</Tag>
                        )}
                    </Space>
                </Flex>
                <Table
                    dataSource={ticket.items}
                    rowKey="id"
                    pagination={false}
                    columns={itemColumns}
                    size="small"
                />
            </div>

            {/* Payments section */}
            <div>
                <Title level={5} style={{ marginBottom: 8 }}>Payments</Title>
                {ticket.payments.length > 0 ? (
                    <List
                        dataSource={ticket.payments}
                        renderItem={(payment) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={
                                        <CreditCardOutlined
                                            style={{ fontSize: 22, color: token.colorPrimary }}
                                        />
                                    }
                                    title={
                                        <Space>
                                            <Text>{payment.paymentType === 0 ? 'Cash' : 'Card'}</Text>
                                            {payment.isVoided && <Tag color="red">Voided</Tag>}
                                            {payment.deivceName && (
                                                <Tag>{payment.deivceName}</Tag>
                                            )}
                                        </Space>
                                    }
                                    description={
                                        payment.invoiceNumber
                                            ? `Invoice: ${payment.invoiceNumber}`
                                            : undefined
                                    }
                                />
                                <Text strong>{currencySymbol}{payment.totalAmount.toFixed(2)}</Text>
                            </List.Item>
                        )}
                    />
                ) : (
                    <Text type="secondary">No payments recorded.</Text>
                )}
            </div>

            {/* Order totals summary */}
            <Card size="small" style={{ background: token.colorFillAlter }}>
                <Descriptions
                    column={1}
                    size="small"
                    items={summaryItems}
                    colon
                    labelStyle={{ color: token.colorTextSecondary }}
                />
                <Divider style={{ margin: '8px 0' }} />
                <Descriptions
                    column={1}
                    size="small"
                    items={paymentSummaryItems}
                    colon
                />
                <Flex justify="flex-end" style={{ marginTop: 8 }}>
                    {getPaymentStatusTag(ticket.paymentStatus)}
                </Flex>
            </Card>
        </Flex>
    );
};

export default TicketDetail;

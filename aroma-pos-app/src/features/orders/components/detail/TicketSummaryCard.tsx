import React from 'react';
import { Card, Divider, Tag, Typography, theme } from 'antd';
import type { TicketItemDetailResponse, TicketPaymentDetailResponse } from '../../types/order-detail.types';

const { Text } = Typography;

interface TicketSummaryCardProps {
    items: TicketItemDetailResponse[];
    payments: TicketPaymentDetailResponse[];
    discount: number;
    isDiscountPercentage: boolean;
    serviceChargePercentage: number;
    paymentStatus: number;
}

const PAYMENT_STATUS_TAG: Record<number, { color: string; label: string }> = {
    1: { color: 'warning', label: 'Pending' },
    2: { color: 'success', label: 'Paid' },
    3: { color: 'processing', label: 'Partial' },
};

const Row: React.FC<{ label: React.ReactNode; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        {strong ? <Text strong>{label}</Text> : <Text type="secondary">{label}</Text>}
        {strong ? <Text strong>{value}</Text> : <Text>{value}</Text>}
    </div>
);

const TicketSummaryCard: React.FC<TicketSummaryCardProps> = ({
    items, payments, discount, isDiscountPercentage, serviceChargePercentage, paymentStatus,
}) => {
    const { token } = theme.useToken();

    const safeItems    = items    ?? [];
    const safePayments = payments ?? [];

    const subtotal = safeItems.reduce((acc, item) => {
        const modExtra = (item.modifiers ?? []).reduce((m, mod) => m + (mod.price ?? 0) * (mod.quantity ?? 1), 0);
        return acc + ((item.price ?? 0) + modExtra) * (item.quantity ?? 1) * (item.portion || 1);
    }, 0);

    const taxAmount = safeItems.reduce((acc, item) => {
        const modExtra = (item.modifiers ?? []).reduce((m, mod) => m + (mod.price ?? 0) * (mod.quantity ?? 1), 0);
        const lineTotal = ((item.price ?? 0) + modExtra) * (item.quantity ?? 1) * (item.portion || 1);
        const itemTax = (item.taxes ?? [])
            .filter(t => t.isActive)
            .reduce((t, tax) => t + lineTotal * ((tax.percentage ?? 0) / 100), 0);
        return acc + itemTax;
    }, 0);

    const discountAmount = isDiscountPercentage ? subtotal * ((discount ?? 0) / 100) : (discount ?? 0);
    const serviceCharge = (subtotal - discountAmount) * ((serviceChargePercentage ?? 0) / 100);
    const total = subtotal - discountAmount + taxAmount + serviceCharge;

    const activePayments = safePayments.filter(p => !p.isVoided);
    const totalPaid = activePayments.reduce((acc, p) => acc + (p.totalAmount ?? 0), 0);
    const balance = total - totalPaid;

    const statusTag = PAYMENT_STATUS_TAG[paymentStatus];

    return (
        <Card size="small" style={{ background: token.colorFillAlter, marginTop: 8 }}>
            <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            {discountAmount > 0 && (
                <Row
                    label={isDiscountPercentage ? `Discount (${discount}%)` : 'Discount'}
                    value={<Text type="danger">-${discountAmount.toFixed(2)}</Text>}
                />
            )}
            {taxAmount > 0 && <Row label="Tax" value={`$${taxAmount.toFixed(2)}`} />}
            {serviceCharge > 0 && (
                <Row label={`Service Charge (${serviceChargePercentage}%)`} value={`$${serviceCharge.toFixed(2)}`} />
            )}
            <Divider style={{ margin: '8px 0' }} />
            <Row label="Total" value={`$${total.toFixed(2)}`} strong />
            <Divider style={{ margin: '8px 0' }} />
            <Row
                label="Paid"
                value={<Text type="success">${totalPaid.toFixed(2)}</Text>}
            />
            <Row
                label={balance > 0 ? 'Balance Due' : 'Change'}
                value={
                    <Text style={{ color: balance > 0 ? token.colorError : token.colorSuccess }}>
                        ${Math.abs(balance).toFixed(2)}
                    </Text>
                }
                strong
            />
            {statusTag && (
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <Tag color={statusTag.color}>{statusTag.label}</Tag>
                </div>
            )}
        </Card>
    );
};

export default TicketSummaryCard;

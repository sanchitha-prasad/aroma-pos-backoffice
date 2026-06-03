import React from 'react';
import { List, Tag, Typography, Empty, theme, Space } from 'antd';
import { useCurrency } from '@/src/shared/context/CurrencyContext';
import { CreditCardOutlined, DollarOutlined, GiftOutlined } from '@ant-design/icons';
import type { TicketPaymentDetailResponse } from '../../types/order-detail.types';

const { Text } = Typography;

// paymentType arrives as string enum: "Cash" | "Card" | "GiftCard" | "GiftVoucher"
const PAYMENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
    Cash:        { label: 'Cash',         icon: <DollarOutlined /> },
    Card:        { label: 'Card',         icon: <CreditCardOutlined /> },
    GiftCard:    { label: 'Gift Card',    icon: <GiftOutlined /> },
    GiftVoucher: { label: 'Gift Voucher', icon: <GiftOutlined /> },
};

const TRANSACTION_TYPE_COLOR: Record<string, string> = {
    Sale:   'success',
    Void:   'error',
    Refund: 'warning',
};

interface PaymentsListProps {
    payments: TicketPaymentDetailResponse[];
}

const PaymentsList: React.FC<PaymentsListProps> = ({ payments }) => {
    const { token } = theme.useToken();
    const { currencySymbol } = useCurrency();
    const activePayments = (payments ?? []).filter(p => !p.isVoided);

    if (activePayments.length === 0) {
        return <Empty description="No payments recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
        <List
            dataSource={activePayments}
            renderItem={(p: TicketPaymentDetailResponse) => {
                // paymentType is a string enum value from the backend
                const typeInfo = PAYMENT_TYPE_CONFIG[p.paymentType]
                    ?? { label: p.paymentType, icon: <CreditCardOutlined /> };

                const txColor = TRANSACTION_TYPE_COLOR[p.paymentTransactionType] ?? 'default';

                return (
                    <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <List.Item.Meta
                            avatar={
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    background: token.colorFillSecondary,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, color: token.colorPrimary,
                                }}>
                                    {typeInfo.icon}
                                </div>
                            }
                            title={
                                <Space>
                                    <Text strong>{typeInfo.label}</Text>
                                    <Tag color={txColor} style={{ fontSize: 10 }}>
                                        {p.paymentTransactionType}
                                    </Tag>
                                    {p.cardProvider && p.cardProvider !== 'Unknown' && (
                                        <Tag style={{ fontSize: 10 }}>{p.cardProvider}</Tag>
                                    )}
                                    {p.deivceName && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>{p.deivceName}</Text>
                                    )}
                                </Space>
                            }
                            description={
                                <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                    {p.referenceNumber && <span>Ref: {p.referenceNumber}{p.invoiceNumber ? ' · ' : ''}</span>}
                                    {p.invoiceNumber   && <span>Invoice: {p.invoiceNumber}</span>}
                                    {p.tipAmount > 0 && (
                                        <div>Tip: <Text type="success">{currencySymbol} {p.tipAmount.toFixed(2)}</Text></div>
                                    )}
                                </div>
                            }
                        />
                        <div style={{ textAlign: 'right' }}>
                            <Text strong style={{ fontSize: 15 }}>{currencySymbol} {(p.totalAmount ?? 0).toFixed(2)}</Text>
                            {p.transactionFee > 0 && (
                                <div style={{ fontSize: 11 }}>
                                    <Text type="secondary">Fee: {currencySymbol} {p.transactionFee.toFixed(2)}</Text>
                                </div>
                            )}
                        </div>
                    </List.Item>
                );
            }}
        />
    );
};

export default PaymentsList;

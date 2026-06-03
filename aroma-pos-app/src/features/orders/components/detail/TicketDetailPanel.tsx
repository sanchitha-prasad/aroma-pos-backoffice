import React from 'react';
import { Typography, Divider, Skeleton } from 'antd';
import TicketItemsTable from './TicketItemsTable';
import PaymentsList from './PaymentsList';
import TicketSummaryCard from './TicketSummaryCard';
import type { OrderTicketDetailResponse } from '../../types/order-detail.types';

const { Title, Text } = Typography;

interface TicketDetailPanelProps {
    ticket: OrderTicketDetailResponse;
}

const TicketDetailPanel: React.FC<TicketDetailPanelProps> = ({ ticket }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {ticket.customerName && (
                <Text type="secondary">Customer: <strong>{ticket.customerName}</strong></Text>
            )}
            {ticket.seatNumber && (
                <Text type="secondary">Seat: <strong>{ticket.seatNumber}</strong></Text>
            )}
            {ticket.note && (
                <Text type="secondary" italic>"{ticket.note}"</Text>
            )}

            <div>
                <Title level={5} style={{ marginBottom: 8 }}>Items</Title>
                <TicketItemsTable items={ticket.items} />
            </div>

            <Divider style={{ margin: 0 }} />

            <div>
                <Title level={5} style={{ marginBottom: 8 }}>Payments</Title>
                <PaymentsList payments={ticket.payments} />
            </div>

            <TicketSummaryCard
                items={ticket.items}
                payments={ticket.payments}
                discount={ticket.discount}
                isDiscountPercentage={ticket.isDiscountPercentage}
                serviceChargePercentage={ticket.serviceChargePercentage}
                paymentStatus={ticket.paymentStatus}
            />
        </div>
    );
};

export const TicketDetailPanelSkeleton: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 8 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 3 }} />
    </div>
);

export default TicketDetailPanel;

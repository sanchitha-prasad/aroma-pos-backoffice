import React from 'react';
import { Drawer, Tabs, Tag } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { Order } from '../../../shared/types';
import { OrderType } from '../../../shared/enums';
import TicketDetail from './TicketDetail';

interface OrderDetailDrawerProps {
    order: Order | null;
    open: boolean;
    onClose: () => void;
}

function orderTypeLabel(type: OrderType) {
    return type === OrderType.DineIn ? 'Dine In' : 'Takeaway';
}

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ order, open, onClose }) => {
    const title = order ? (
        <span>
            Order <strong>#{order.orderCode}</strong>
            {order.tableName && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                    {order.tableName}
                </Tag>
            )}
            <Tag color="default" style={{ marginLeft: 4 }}>
                {orderTypeLabel(order.orderType)}
            </Tag>
        </span>
    ) : 'Order Details';

    return (
        <Drawer title={title} size="large" open={open} onClose={onClose} destroyOnClose>
            {order && (
                <Tabs
                    defaultActiveKey="0"
                    items={order.tickets.map((ticket, index) => ({
                        key: index.toString(),
                        label: (
                            <span>
                                <FileTextOutlined /> Ticket #{ticket.ticketNumber}
                            </span>
                        ),
                        children: <TicketDetail ticket={ticket} />,
                    }))}
                />
            )}
        </Drawer>
    );
};

export default OrderDetailDrawer;

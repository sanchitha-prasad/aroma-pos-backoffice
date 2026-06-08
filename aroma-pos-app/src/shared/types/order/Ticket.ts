import { TicketItem } from './TicketItem';
import { TicketPayment } from './TicketPayment';

export interface Ticket {
    id: string;
    ticketNumber: number;
    ticketCode: number;
    discount: number;
    isDiscountPercentage: boolean;
    serviceChargePercentage: number;
    seatId: string | null;
    seatNumber: string | null;
    customerId: string | null;
    customerName: string;
    orderId: string;
    paymentStatus: number;
    splitedType: number;
    note: string | null;
    orderCode: number;
    tableId: string | null;
    tableName: string | null;
    items: TicketItem[];
    payments: TicketPayment[];
}

import { TicketItem } from './TicketItem';
import { TicketPayment } from './TicketPayment';

export interface Ticket {
    id: string;
    ticketNumber: number;
    ticketCode: number;
    discount: number;
    isDiscountPercentage: boolean;
    serviceCharge: number;
    isServiceChargePercentage: boolean;
    paymentStatus: number; 
    items: TicketItem[];
    payments: TicketPayment[];
}

import { OrderType } from '../../enums';
import { Ticket } from './Ticket';

export interface Order {
    id: string;
    orderNumber: number;
    tableId: string;
    tableName: string;
    splitedType: number;
    orderType: OrderType;
    tickets: Ticket[];
}

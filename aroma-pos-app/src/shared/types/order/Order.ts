import { OrderType } from '../../enums';
import { Ticket } from './Ticket';

export interface Order {
    id: string;
    orderCode: number;
    tableId: string | null;
    tableName: string | null;
    splitedType: number;
    orderType: OrderType;
    orderStatusType: number;
    tickets: Ticket[];
}

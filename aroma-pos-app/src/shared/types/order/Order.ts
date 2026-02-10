import { Ticket } from './Ticket';

export interface Order {
    id: string;
    orderNumber: number;
    tableId: string;
    tableName: string;
    splitedType: number;
    orderType: number;
    tickets: Ticket[];
}

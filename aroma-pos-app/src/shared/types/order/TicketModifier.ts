export interface TicketModifier {
    id: string;
    name: string;
    description?: string;
    price: number;
    isActive: boolean;
    quantity: number;
}

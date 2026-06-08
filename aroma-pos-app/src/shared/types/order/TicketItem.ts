import { TicketModifier } from './TicketModifier';
import { TicketVariant } from './TicketVariant';
import { TicketTax } from './TicketTax';

export interface TicketItem {
    id: string;
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    portionNumerator: number;
    portionDenominator: number;
    discount: number;
    isDiscountPercentage: boolean;
    isSplit: boolean;
    sequence: number;
    seatId: string | null;
    seatNumber: string | null;
    seatColor: string | null;
    note: string | null;
    isSent: boolean;
    modifiers: TicketModifier[];
    variant: TicketVariant | null;
    taxes: TicketTax[];
}

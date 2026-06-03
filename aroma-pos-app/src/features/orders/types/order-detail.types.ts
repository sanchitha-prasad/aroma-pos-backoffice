// ── Enums as received from backend JSON ──────────────────────────────────────
// Fields declared as `int` in C# response DTOs → arrive as numbers in JSON.
// Fields declared as enum type in C# response DTOs → arrive as strings in JSON
// (e.g. PaymentMethodType, PaymentTransactionType, CardProviderType, SplitType, OrderStatusType).

export interface OrderDetailResponse {
    id: string;
    tableId: string | null;
    tableName: string | null;
    splitedType: string;              // SplitType enum → "None" | "SplitBySeat" | ...
    orderType: number;                // int  → 1=DineIn, 2=TakeAway
    orderStatusType: string;          // OrderStatusType enum → "Ordered" | "Completed" | ...
    orderCode: number;
    tickets: OrderTicketDetailResponse[];
}

export interface OrderTicketDetailResponse {
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
    paymentStatus: number;            // int  → 1=Pending, 2=Paid, 3=PartiallyPaid, 4=Refunded
    splitedType: string;              // SplitType enum → "None" | ...
    note: string | null;
    orderCode: number;
    tableId: string | null;
    tableName: string | null;
    payments: TicketPaymentDetailResponse[];
    items: TicketItemDetailResponse[];
}

export interface TicketItemDetailResponse {
    id: string;
    itemId: string;
    orderItemId: string | null;
    seatId: string | null;
    quantity: number;
    portion: number;
    price: number;
    name: string;
    isDiscountPercentage: boolean;
    discount: number;
    isSplited: boolean;
    sequence: number;
    seatNumber: string | null;
    seatColor: string | null;
    note: string | null;
    isSent: boolean;
    modifiers: TicketModifierDetailResponse[];
    variant: TicketVariantDetailResponse | null;
    taxes: TicketTaxDetailResponse[];
}

export interface TicketModifierDetailResponse {
    id: string;
    name: string;
    description: string;
    price: number;
    isActive: boolean;
    quantity: number;
}

export interface TicketVariantDetailResponse {
    id: string;
    variantName: string;
    price: number;
    status: string;
}

export interface TicketTaxDetailResponse {
    id: string;
    name: string;
    percentage: number;
    isActive: boolean;
}

export interface TicketPaymentDetailResponse {
    id: string;
    baseAmount: number;
    totalAmount: number;
    tipAmount: number;
    transactionFee: number;
    paymentType: string;              // PaymentMethodType enum → "Cash" | "Card" | "GiftCard" | "GiftVoucher"
    deviceId: string;
    deivceName: string;               // backend typo preserved
    isVoided: boolean;
    paymentTransactionType: string;   // PaymentTransactionType enum → "Sale" | "Void" | "Refund"
    cardProvider: string | null;      // CardProviderType enum → "Unknown" | "HNB" | null
    invoiceNumber: string | null;
    referenceNumber: string | null;
}

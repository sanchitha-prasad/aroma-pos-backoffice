export interface TicketPayment {
    id: string;
    baseAmount: number;
    totalAmount: number;
    tipAmount: number;
    transactionFee: number;
    paymentType: number;
    deviceId: string;
    deivceName: string;
    isVoided: boolean;
    paymentTransactionType: number;
    cardProvider: number | null;
    invoiceNumber: string | null;
    referenceNumber: string | null;
}

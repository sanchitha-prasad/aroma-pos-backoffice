import type { OrderDetailResponse, OrderTicketDetailResponse } from '../types/order-detail.types';
import type { OrderStatusFilter } from '../types/order-filters.types';

// ── Backend enum values ───────────────────────────────────────────────────────
// OrderType:              DineIn = 1, TakeAway = 2
// TicketPaymentStatusType: Pending = 1, Paid = 2, PartiallyPaid = 3, Refunded = 4

export const ORDER_TYPE = { DineIn: 1, TakeAway: 2 } as const;

export const TICKET_PAYMENT_STATUS = {
    Pending:       1,
    Paid:          2,
    PartiallyPaid: 3,
    Refunded:      4,
} as const;

// ── Per-ticket financial helpers ──────────────────────────────────────────────

export function computeTicketSubtotal(ticket: OrderTicketDetailResponse): number {
    return (ticket.items ?? []).reduce((acc, item) => {
        const modExtra = (item.modifiers ?? []).reduce(
            (m, mod) => m + (mod.price ?? 0) * (mod.quantity ?? 1), 0,
        );
        return acc + ((item.price ?? 0) + modExtra) * (item.quantity ?? 1) * (item.portion || 1);
    }, 0);
}

export function computeTicketTax(ticket: OrderTicketDetailResponse): number {
    return (ticket.items ?? []).reduce((acc, item) => {
        const modExtra = (item.modifiers ?? []).reduce(
            (m, mod) => m + (mod.price ?? 0) * (mod.quantity ?? 1), 0,
        );
        const lineTotal = ((item.price ?? 0) + modExtra) * (item.quantity ?? 1) * (item.portion || 1);
        return acc + (item.taxes ?? [])
            .filter(t => t.isActive)
            .reduce((t, tax) => t + lineTotal * ((tax.percentage ?? 0) / 100), 0);
    }, 0);
}

export function computeTicketTotal(ticket: OrderTicketDetailResponse): number {
    const sub      = computeTicketSubtotal(ticket);
    const tax      = computeTicketTax(ticket);
    const discAmt  = ticket.isDiscountPercentage
        ? sub * ((ticket.discount ?? 0) / 100)
        : (ticket.discount ?? 0);
    const svcCharge = (sub - discAmt) * ((ticket.serviceChargePercentage ?? 0) / 100);
    return sub - discAmt + tax + svcCharge;
}

export function computeTicketPaid(ticket: OrderTicketDetailResponse): number {
    return (ticket.payments ?? [])
        .filter(p => !p.isVoided)
        .reduce((acc, p) => acc + (p.totalAmount ?? 0), 0);
}

// ── Per-ticket item count — unique order items only (avoid double-counting splits) ──

export function countTicketItems(ticket: OrderTicketDetailResponse): number {
    // Each TicketItem has an orderItemId — split order items share the same orderItemId.
    // Count distinct orderItemIds to get the real number of unique items.
    const ids = new Set(
        (ticket.items ?? [])
            .map(i => i.orderItemId)
            .filter((id): id is string => !!id),
    );
    // Fall back to raw item count if orderItemId not present
    return ids.size || (ticket.items ?? []).length;
}

// ── Order-level summary ───────────────────────────────────────────────────────

export interface OrderSummary {
    totalAmount: number;
    paidAmount: number;
    balance: number;
    ticketCount: number;
    itemCount: number;
    /** 1=Pending  2=Paid  3=PartiallyPaid — derived from actual ticket paymentStatus fields */
    paymentStatus: 1 | 2 | 3;
    paymentStatusLabel: 'Paid' | 'Pending' | 'PartiallyPaid';
}

export function computeOrderSummary(order: OrderDetailResponse): OrderSummary {
    const tickets = order.tickets ?? [];

    let totalAmount = 0;
    let paidAmount  = 0;
    let itemCount   = 0;

    for (const ticket of tickets) {
        totalAmount += computeTicketTotal(ticket);
        paidAmount  += computeTicketPaid(ticket);
        itemCount   += countTicketItems(ticket);
    }

    const balance = totalAmount - paidAmount;

    // ── Derive aggregate payment status from actual ticket paymentStatus fields ──
    // This is the source of truth — do NOT re-derive from computed amounts.
    let paymentStatus: 1 | 2 | 3;

    if (tickets.length === 0) {
        paymentStatus = 1; // no tickets → Pending
    } else {
        const allPaid    = tickets.every(t => t.paymentStatus === TICKET_PAYMENT_STATUS.Paid);
        const allPending = tickets.every(t => t.paymentStatus === TICKET_PAYMENT_STATUS.Pending);

        if (allPaid)    paymentStatus = 2;
        else if (allPending) paymentStatus = 1;
        else            paymentStatus = 3;
    }

    const paymentStatusLabel =
        paymentStatus === 2 ? 'Paid' :
        paymentStatus === 1 ? 'Pending' :
        'PartiallyPaid';

    return {
        totalAmount,
        paidAmount,
        balance,
        ticketCount: tickets.length,
        itemCount,
        paymentStatus,
        paymentStatusLabel,
    };
}

// ── Label helpers ─────────────────────────────────────────────────────────────

/** orderType: DineIn = 1, TakeAway = 2 */
export function getOrderTypeLabel(orderType: number): 'DineIn' | 'Takeaway' {
    return orderType === ORDER_TYPE.DineIn ? 'DineIn' : 'Takeaway';
}

export function matchesStatusFilter(summary: OrderSummary, filter: OrderStatusFilter): boolean {
    if (filter === 'all')     return true;
    if (filter === 'paid')    return summary.paymentStatus === 2;
    if (filter === 'pending') return summary.paymentStatus === 1;
    if (filter === 'partial') return summary.paymentStatus === 3;
    return true;
}

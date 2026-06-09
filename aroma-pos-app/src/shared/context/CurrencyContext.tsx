import { createContext, useContext } from 'react';

export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    LKR: 'LKR',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    JPY: '¥',
    CNY: '¥',
    SGD: 'S$',
};

export interface CurrencyContextValue {
    currencyCode: string;
    currencySymbol: string;
    formatCurrency: (amount: number) => string;
}

export const CurrencyContext = createContext<CurrencyContextValue>({
    currencyCode: 'LKR',
    currencySymbol: 'LKR',
    formatCurrency: (amount) => `LKR ${amount.toFixed(2)}`,
});

export const useCurrency = () => useContext(CurrencyContext);


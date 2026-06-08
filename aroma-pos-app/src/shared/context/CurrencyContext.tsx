import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useTenantSettings } from '../../features/system/hooks/useTenantSettings';

const CURRENCY_SYMBOLS: Record<string, string> = {
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

interface CurrencyContextValue {
    currencyCode: string;
    currencySymbol: string;
    formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
    currencyCode: 'LKR',
    currencySymbol: 'LKR',
    formatCurrency: (amount) => `LKR ${amount.toFixed(2)}`,
});

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { data: settings } = useTenantSettings();

    const currencyCode = useMemo(() => {
        const entry = (settings || []).find((item) => item.key === 'DefaultCurrency');
        return entry?.value || 'LKR';
    }, [settings]);

    const value = useMemo<CurrencyContextValue>(() => {
        const currencySymbol = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;
        return {
            currencyCode,
            currencySymbol,
            formatCurrency: (amount: number) => `${currencySymbol} ${amount.toFixed(2)}`,
        };
    }, [currencyCode]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);

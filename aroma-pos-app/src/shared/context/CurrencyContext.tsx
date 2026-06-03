import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api/client';
import { authStore } from '../services/auth/authStore';

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    LKR: 'Rs',
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
    currencySymbol: 'Rs',
    formatCurrency: (amount) => `Rs ${amount.toFixed(2)}`,
});

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currencyCode, setCurrencyCode] = useState('LKR');

    useEffect(() => {
        const fetchCurrency = async () => {
            if (!authStore.tenantId) return;
            try {
                const data = await apiClient.get<any[]>('/api/tenant-settings');
                const entry = (data || []).find((item: any) => item.key === 'DefaultCurrency');
                if (entry?.value) setCurrencyCode(entry.value);
            } catch {
                // keep default
            }
        };
        fetchCurrency();
    }, []);

    const currencySymbol = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;

    const formatCurrency = (amount: number) => `${currencySymbol} ${amount.toFixed(2)}`;

    return (
        <CurrencyContext.Provider value={{ currencyCode, currencySymbol, formatCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);

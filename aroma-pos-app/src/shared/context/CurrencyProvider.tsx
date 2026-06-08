import React, { useMemo, ReactNode } from 'react';
import { useTenantSettings } from '../../features/system/hooks/useTenantSettings';
import { CurrencyContext, CurrencyContextValue, CURRENCY_SYMBOLS } from './CurrencyContext';

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

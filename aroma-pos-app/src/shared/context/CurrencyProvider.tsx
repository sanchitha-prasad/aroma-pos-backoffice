import React, { useMemo, useCallback, ReactNode } from 'react';
import { useTenantSettings } from '../../features/system/hooks/useTenantSettings';
import { CurrencyContext, CurrencyContextValue, CURRENCY_SYMBOLS } from './CurrencyContext';

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { data: settings } = useTenantSettings();

    const currencyCode = useMemo(() => {
        const entry = (settings || []).find((item) => item.key === 'DefaultCurrency');
        return entry?.value || 'LKR';
    }, [settings]);

    const currencySymbol = useMemo(() => {
        return CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;
    }, [currencyCode]);

    const formatCurrency = useCallback((amount: number) => {
        return `${currencySymbol} ${amount.toFixed(2)}`;
    }, [currencySymbol]);

    const value = useMemo<CurrencyContextValue>(() => ({
        currencyCode,
        currencySymbol,
        formatCurrency,
    }), [currencyCode, currencySymbol, formatCurrency]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getFinancialSettings, type FinancialSettingsResponse } from '@/components/booking/api';

type FinancialSettingsContextValue = {
  currencyCode: string;
  currencySymbol: string;
  payLaterEnabled: boolean;
  stripeEnabled: boolean;
  isReady: boolean;
  error?: unknown;
};

const DEFAULT_CURRENCY = 'USD';

function currencySymbolFromCode(code: string): string {
  try {
    const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: code.toUpperCase() }).formatToParts(0);
    const sym = parts.find(p => p.type === 'currency')?.value;
    return sym || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

const initialContext: FinancialSettingsContextValue = {
  currencyCode: DEFAULT_CURRENCY,
  currencySymbol: currencySymbolFromCode(DEFAULT_CURRENCY),
  payLaterEnabled: false,
  stripeEnabled: false,
  isReady: false,
};

const FinancialSettingsContext = createContext<FinancialSettingsContextValue>(initialContext);

export function useFinancialSettings(): FinancialSettingsContextValue {
  return useContext(FinancialSettingsContext);
}

type ProviderProps = {
  tenantId: string;
  apiUrl?: string;
  children: React.ReactNode;
};

/**
 * Fetches tenant financial settings once on mount and exposes:
 * - currencyCode/currencySymbol
 * - payLaterEnabled/stripeEnabled
 * - isReady
 * On failure, logs and exposes safe defaults (USD, both disabled).
 */
export function FinancialSettingsProvider({ tenantId, apiUrl, children }: ProviderProps) {
  const [state, setState] = useState<FinancialSettingsContextValue>(initialContext);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // mark loading state while keeping current values
      setState(prev => ({ ...prev, isReady: false, error: undefined }));
      try {
        const res: FinancialSettingsResponse = await getFinancialSettings(tenantId, apiUrl);
        if (cancelled) return;

        const code = res?.financial?.currency || DEFAULT_CURRENCY;
        const symbol = currencySymbolFromCode(code);
        const payLater = !!res?.financial?.payLaterEnabled;
        const stripe = !!res?.financial?.stripeEnabled;

        setState({
          currencyCode: code,
          currencySymbol: symbol,
          payLaterEnabled: payLater,
          stripeEnabled: stripe,
          isReady: true,
        });
      } catch (err) {
        if (cancelled) return;
        console.error('Financial settings load failed, using defaults:', err);
        const code = DEFAULT_CURRENCY;
        setState({
          currencyCode: code,
          currencySymbol: currencySymbolFromCode(code),
          payLaterEnabled: false,
          stripeEnabled: false,
          isReady: true,
          error: err,
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, apiUrl]);

  const value = useMemo(() => state, [state]);

  return (
    <FinancialSettingsContext.Provider value={value}>
      {children}
    </FinancialSettingsContext.Provider>
  );
}
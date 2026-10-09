'use client';

import { createContext, useContext } from 'react';
import { formatMoney } from '@/lib/utils';

const Ctx = createContext<{
  settings: Record<string, string>;
  money: (minor: number) => string;
}>({ settings: {}, money: (n) => formatMoney(n) });

export function SettingsProvider({
  settings,
  children,
}: {
  settings: Record<string, string>;
  children: React.ReactNode;
}) {
  const symbol = settings.currency_symbol || 'GH₵';
  return (
    <Ctx.Provider value={{ settings, money: (n: number) => formatMoney(n, symbol) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSettings = () => useContext(Ctx);
export const useMoney = () => useContext(Ctx).money;

'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type Toast = { id: number; message: string; type: 'ok' | 'err' };
const Ctx = createContext<(m: string, t?: 'ok' | 'err') => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, message, type }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 3600);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[999] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-up pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl ${
              t.type === 'ok'
                ? 'border-brand-500/40 bg-brand-950/80 text-white'
                : 'border-white/10 bg-ink-800/90 text-white'
            }`}
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                t.type === 'ok' ? 'bg-brand-500 text-white' : 'bg-white/15 text-white'
              }`}
            >
              {t.type === 'ok' ? '✓' : '!'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

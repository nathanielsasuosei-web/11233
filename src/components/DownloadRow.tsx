'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function DownloadRow({
  title,
  license,
  price,
  token,
  downloads,
  limit,
  paid,
  cover,
  slug,
}: {
  title: string;
  license: string;
  price: string;
  token: string;
  downloads: number;
  limit: number;
  paid: boolean;
  cover?: string;
  slug?: string;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function download() {
    if (!paid) {
      toast('Waiting for payment confirmation', 'err');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/download/${token}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = res.redirected ? (res as any).url || url : url;
      a.href = url;
      a.download = `${title}-${license}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast('Download started 🎧');
    } catch (e: any) {
      toast(e.message || 'Download failed', 'err');
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    navigator.clipboard
      ?.writeText(`${window.location.origin}/api/download/${token}`)
      .then(() => toast('Download link copied'))
      .catch(() => toast('Could not copy link', 'err'));
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/[.07] bg-ink-850/60 p-4">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-800">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-800 to-ink-900 text-[9px] font-black text-white/50">
            BV
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {slug ? (
          <Link href={`/beats/${slug}`} className="truncate text-[14px] font-bold text-white hover:text-brand-300">
            {title}
          </Link>
        ) : (
          <div className="truncate text-[14px] font-bold text-white">{title}</div>
        )}
        <div className="text-[11px] text-brand-300">{license}</div>
        <div className="mt-1 text-[11px] text-white/35">
          {downloads}/{limit} downloads used
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-[13px] font-bold text-white sm:block">{price}</span>
        <button onClick={copyLink} className="btn-dark !px-4 !py-2.5 text-[11px]">
          Copy link
        </button>
        <button
          onClick={download}
          disabled={busy || !paid}
          className="btn-red !px-5 !py-2.5 text-[12px]"
        >
          {busy ? '…' : 'Download'}
        </button>
      </div>
    </div>
  );
}

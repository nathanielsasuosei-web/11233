'use client';

/**
 * Shared motion helpers for the login / signup forms.
 * The visual effects live in globals.css (`.auth-*` classes).
 */

/** Restarts the error shake on a card, even if it is already shaking. */
export function shake(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove('auth-shake');
  void el.offsetWidth; // force reflow so the animation replays
  el.classList.add('auth-shake');
}

function Check({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        className="auth-check-path"
        d="M5 12.5l4.2 4.2L19 7"
        pathLength={1}
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Submit button that morphs through idle → loading → success.
 * Loading shows a spinner; success fades a green fill in and draws a check.
 */
export function AuthSubmitButton({
  busy,
  success,
  idleLabel,
  loadingLabel,
  successLabel,
}: {
  busy: boolean;
  success: boolean;
  idleLabel: string;
  loadingLabel: string;
  successLabel: string;
}) {
  const label = success ? successLabel : busy ? loadingLabel : idleLabel;
  return (
    <button
      type="submit"
      disabled={busy || success}
      aria-live="polite"
      className={`btn-red relative w-full overflow-hidden !py-3.5 text-sm transition-transform duration-300 ${
        success ? '!opacity-100' : ''
      }`}
    >
      {/* Green success fill fades over the red gradient. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 transition-opacity duration-500"
        style={{
          opacity: success ? 1 : 0,
          boxShadow: success ? '0 10px 30px -10px rgba(34,197,94,.7)' : undefined,
        }}
      />
      <span className="relative inline-flex items-center gap-2.5">
        {busy && !success && (
          <span className="auth-spin inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
        )}
        {success && <Check className="auth-pop h-5 w-5" />}
        <span key={label} className="auth-label-in">
          {label}
        </span>
      </span>
    </button>
  );
}

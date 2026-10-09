/** Keeps a single beat preview playing across the whole page. */
type AudioListener = (el: HTMLAudioElement | null) => void;

let current: HTMLAudioElement | null = null;
const listeners = new Set<AudioListener>();

function emit() {
  for (const fn of listeners) fn(current);
}

/**
 * Subscribe to "who owns the speakers". Every player uses this so a card that
 * got interrupted never keeps showing a pause button while it is silent.
 */
export function onAudioChange(fn: AudioListener) {
  listeners.add(fn);
  fn(current);
  return () => {
    listeners.delete(fn);
  };
}

export function claimAudio(el: HTMLAudioElement, onOthersStopped?: () => void) {
  if (current && current !== el) {
    current.pause();
    current.currentTime = 0;
    onOthersStopped?.();
  }
  current = el;
  emit();
}

export function stopAllAudio() {
  if (current) {
    current.pause();
    current.currentTime = 0;
  }
  current = null;
  emit();
}

export function releaseAudio(el: HTMLAudioElement) {
  if (current === el) {
    current = null;
    emit();
  }
}

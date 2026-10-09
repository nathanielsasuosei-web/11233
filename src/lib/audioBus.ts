/** Keeps a single beat preview playing across the whole page. */
let current: HTMLAudioElement | null = null;

export function claimAudio(el: HTMLAudioElement, onOthersStopped?: () => void) {
  if (current && current !== el) {
    current.pause();
    current.currentTime = 0;
    onOthersStopped?.();
  }
  current = el;
}

export function stopAllAudio() {
  if (current) {
    current.pause();
    current.currentTime = 0;
  }
  current = null;
}

export function releaseAudio(el: HTMLAudioElement) {
  if (current === el) current = null;
}

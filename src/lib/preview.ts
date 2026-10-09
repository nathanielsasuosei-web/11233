/**
 * One place that decides what a beat's preview actually is.
 *
 * Every beat gets a preview: the tagged clip when the producer uploaded one,
 * otherwise the master file. Nothing in the UI should guess differently, so a
 * beat never shows up as "unplayable" just because it has no separate clip.
 */
export type PreviewSource = {
  preview_url?: string | null;
  audio_url?: string | null;
};

/** Playable source for a beat, or '' when the producer has not attached audio yet. */
export function previewSrc(beat?: PreviewSource | null): string {
  if (!beat) return '';
  return beat.preview_url || beat.audio_url || '';
}

/** True when the beat has its own tagged clip (rather than falling back to the master). */
export function isTaggedPreview(beat?: PreviewSource | null): boolean {
  return Boolean(beat?.preview_url);
}

/** Short label used next to every preview player so the source is never ambiguous. */
export function previewLabel(beat?: PreviewSource | null): string {
  if (!previewSrc(beat)) return 'no preview yet';
  return isTaggedPreview(beat) ? 'tagged preview · 30s' : 'master preview · full length';
}

/** Beats that can actually be previewed, in the order they were given. */
export function playableBeats<T extends PreviewSource>(beats: T[]): T[] {
  return beats.filter((b) => Boolean(previewSrc(b)));
}

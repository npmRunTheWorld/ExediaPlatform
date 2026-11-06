// Small input guards for server actions. Everything that reaches Sanity passes through these.

export function text(value: FormDataEntryValue | null | undefined, max: number): string {
  if (typeof value !== 'string') return '';
  // Drop control characters except newlines and tabs, then trim and cap.
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);
}

export function httpUrl(value: FormDataEntryValue | null | undefined): string | null {
  const raw = text(value, 2000);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

// Sanity document ids: letters, digits, dot, dash, underscore. Rejects anything that
// could break out of a GROQ string or patch path.
export function docId(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(value) ? value : null;
}

export const CATEGORIES = [
  'illustration', 'painting', 'drawing', 'photo', 'design', 'craft', 'nature',
  'technology', 'cars', 'fitness', 'wallpaper', 'websites', 'food', 'travel',
  'quotes', 'animals', 'medical', 'art', 'others',
] as const;

export function category(value: FormDataEntryValue | null): string | null {
  const v = text(value, 40).toLowerCase();
  return (CATEGORIES as readonly string[]).includes(v) ? v : null;
}

export const REPORT_REASONS = {
  'ai-undeclared': 'Looks AI generated but is not labelled',
  'not-theirs': 'Not their work, or credit is missing',
  'fake-process': 'Process shots look staged or copied',
  'harmful': 'Harmful or abusive',
  'spam': 'Spam or misleading link',
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;

export function reportReason(value: FormDataEntryValue | null): ReportReason | null {
  const v = text(value, 40);
  return Object.hasOwn(REPORT_REASONS, v) ? (v as ReportReason) : null;
}

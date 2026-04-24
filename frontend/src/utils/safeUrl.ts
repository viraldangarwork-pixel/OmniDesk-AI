/**
 * URL-safety helpers for rendering untrusted strings.
 *
 * Vue already escapes text interpolation and attribute bindings, so
 * `<a :href="url">` is XSS-safe against HTML injection.  It is NOT safe
 * against URL-scheme injection though — a value like `javascript:alert(1)`
 * happily flows through because it's a "valid" URL.  These helpers
 * normalise anything user- or server-provided down to a safe scheme.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/**
 * Returns the input URL if it uses an allowed scheme; otherwise returns
 * `null`.  `null` so the caller can decide whether to hide the link or
 * fall back to a disabled state.
 *
 *   const href = safeUrl(document.source_url) ?? '#'
 */
export function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Relative URLs (starting with / or ./ or ../) are safe — they can't
  // change origin.  Empty path (`#foo`) is also safe.
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed, window.location.origin)
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : null
  } catch {
    return null
  }
}

/**
 * Default `rel` attribute for every outbound link — blocks `window.opener`
 * hijacking (the classic `target="_blank"` vulnerability) and prevents the
 * referrer from leaking tenant URLs to third parties.
 */
export const EXTERNAL_REL = 'noopener noreferrer'

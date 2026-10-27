/** Vite substitutes this at build time. Production defaults to the shared origin. */
export function resolveApiBase(configured: string | undefined, production: boolean): string {
  const base = configured?.trim().replace(/\/+$/, '') || ''
  if (production && base) {
    const url = new URL(base)
    if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      throw new Error('Production API URL must be HTTPS and cannot point to localhost. Leave VITE_API_BASE_URL unset for same-origin routing.')
    }
  }
  return base || (production ? '' : 'http://localhost:8000')
}

export const API_BASE = resolveApiBase(import.meta.env.VITE_API_BASE_URL, import.meta.env.PROD)

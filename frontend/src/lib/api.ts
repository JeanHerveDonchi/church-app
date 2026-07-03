import { supabase } from '../providers/supabaseClient'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

// Generic fetch helper that attaches the Supabase JWT when available.
// Throws an Error with a French-friendly message on non-ok responses.
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(
      (body as { message?: string }).message ?? res.statusText,
    )
  }

  return res.json() as Promise<T>
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({
            name,
            value: (() => { try { return decodeURIComponent(value) } catch { return value } })(),
          }))
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const safeValue = encodeURIComponent(value)
              cookieStore.set(name, safeValue, options)
            })
          } catch {
            // Server Component에서 호출된 경우 무시
          }
        },
      },
    }
  )
}

/**
 * 단순 인메모리 레이트 리미터
 * 참고: Vercel 서버리스 환경에서는 인스턴스 간 상태가 공유되지 않습니다.
 * 트래픽이 많아지면 Supabase 테이블이나 외부 KV 스토어로 교체하세요.
 */
type Entry = { count: number; resetAt: number }
const store = new Map<string, Entry>()

// 1분마다 만료된 항목 정리 (메모리 누수 방지)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key)
    })
  }, 60_000)
}

/**
 * @param key     고유 식별자 (예: `signup:1.2.3.4`)
 * @param max     windowMs 내 최대 허용 횟수
 * @param windowMs 제한 윈도우 (밀리초)
 * @returns true = 허용, false = 차단
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false
  entry.count++
  return true
}

/** 요청에서 클라이언트 IP 추출 */
export function getClientIp(req: Request): string {
  return (
    (req.headers as Headers).get('x-forwarded-for')?.split(',')[0].trim() ??
    (req.headers as Headers).get('x-real-ip') ??
    'unknown'
  )
}

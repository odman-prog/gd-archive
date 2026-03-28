/**
 * 비밀번호 재설정 일회용 토큰 스토어
 * verify-identity 성공 시 토큰을 발급하고, reset-password에서 소비합니다.
 * 토큰은 10분 후 만료되며 1회만 사용 가능합니다.
 */
type TokenEntry = { profileId: string; expiresAt: number }
const tokens = new Map<string, TokenEntry>()

// 만료된 토큰 주기적 정리
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    tokens.forEach((entry, token) => {
      if (now > entry.expiresAt) tokens.delete(token)
    })
  }, 60_000)
}

const TOKEN_TTL_MS = 10 * 60 * 1000 // 10분

/** verify-identity 성공 후 호출 → 일회용 토큰 반환 */
export function createResetToken(profileId: string): string {
  const token = crypto.randomUUID()
  tokens.set(token, { profileId, expiresAt: Date.now() + TOKEN_TTL_MS })
  return token
}

/**
 * reset-password 호출 시 토큰 검증 및 소비
 * @returns profileId (유효한 경우) 또는 null (만료/존재하지 않음)
 */
export function consumeResetToken(token: string): string | null {
  const entry = tokens.get(token)
  tokens.delete(token) // 유효 여부와 무관하게 즉시 삭제 (1회용)
  if (!entry || Date.now() > entry.expiresAt) return null
  return entry.profileId
}

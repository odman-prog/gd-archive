import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uqpfllbwgurgagkolshc.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcGZsbGJ3Z3VyZ2Fna29sc2hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkyMTMzNSwiZXhwIjoyMDg5NDk3MzM1fQ.yLCMxOTr5nuq0-4FJ2I9fIGoHTmk6EGeK0ceCP-XSiA'

const TEACHER_NAME = '관리자'
const TEACHER_ID   = 'teacher01'
const PASSWORD     = 'gd1387'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = `${TEACHER_ID}@gd-archive.internal`

// 기존 auth 계정 조회 후 삭제
const { data: { users } } = await supabase.auth.admin.listUsers()
const existing = users.find(u => u.email === email)
if (existing) {
  console.log('기존 계정 삭제 중...')
  await supabase.from('profiles').delete().eq('id', existing.id)
  await supabase.auth.admin.deleteUser(existing.id)
}

// Auth 계정 생성
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password: PASSWORD,
  email_confirm: true,
})

if (authError) {
  console.error('❌ Auth 계정 생성 실패:', authError.message)
  process.exit(1)
}

// profiles 저장
const { error: profileError } = await supabase.from('profiles').insert({
  id: authData.user.id,
  name: TEACHER_NAME,
  student_id: TEACHER_ID,
  grade: 1,
  class: 1,
  number: 1,
  status: 'approved',
  role: 'teacher',
})

if (profileError) {
  await supabase.auth.admin.deleteUser(authData.user.id)
  console.error('❌ 프로필 저장 실패:', profileError.message)
  process.exit(1)
}

console.log('✅ 교사 계정 생성 완료!')
console.log(`   로그인 ID: ${TEACHER_ID}`)
console.log(`   비밀번호: ${PASSWORD}`)

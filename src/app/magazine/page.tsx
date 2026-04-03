import { createClient as createAnonClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import MagazineClient from './MagazineClient'

// 매거진 목록은 공개 데이터 → anon 클라이언트로 캐싱
const getMagazines = unstable_cache(
  async () => {
    const supabase = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('magazines')
      .select('id, title, issue_number, theme, publish_date, cover_url, pdf_url')
      .order('issue_number', { ascending: false })
    return data ?? []
  },
  ['magazines-list'],
  { revalidate: 60, tags: ['magazines'] }
)

export default async function MagazinePage() {
  // 공개 목록(캐시됨) + 유저 권한 확인(매 요청) 병렬 처리
  const [magazines, { data: { user } }] = await Promise.all([
    getMagazines(),
    createClient().auth.getUser(),
  ])

  let canRegister = false
  if (user) {
    const { data: profile } = await createClient()
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    canRegister = profile?.role === 'teacher' || profile?.role === 'chief_editor'
  }

  return (
    <MagazineClient
      initialMagazines={magazines}
      canRegister={canRegister}
    />
  )
}

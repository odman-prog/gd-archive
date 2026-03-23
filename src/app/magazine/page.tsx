import { createClient } from '@/lib/supabase/server'
import MagazineClient from './MagazineClient'

export const revalidate = 60 // 60초 ISR 캐싱

export default async function MagazinePage() {
  const supabase = createClient()

  const { data: magazines } = await supabase
    .from('magazines')
    .select('id, title, issue_number, theme, publish_date, cover_url, pdf_url')
    .order('issue_number', { ascending: false })

  const { data: { user } } = await supabase.auth.getUser()

  let canRegister = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    canRegister = profile?.role === 'teacher' || profile?.role === 'chief_editor'
  }

  return (
    <MagazineClient
      initialMagazines={magazines ?? []}
      canRegister={canRegister}
    />
  )
}

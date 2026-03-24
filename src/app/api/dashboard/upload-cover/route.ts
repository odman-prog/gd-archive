import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('환경변수 누락')
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    const serverClient = createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const { data: profile } = await serverClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['editor', 'chief_editor'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: '편집부 권한이 필요합니다.' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const id = formData.get('id') as string | null

    if (!file || !id) return NextResponse.json({ error: 'file 또는 id 누락' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: '이미지 파일만 가능합니다.' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '이미지는 최대 10MB입니다.' }, { status: 400 })

    const admin = getAdminClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `covers/editorial/${id}_${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await admin.storage
      .from('uploads')
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = admin.storage.from('uploads').getPublicUrl(path)

    const { error: updateError } = await admin
      .from('contents')
      .update({ cover_image_url: publicUrl })
      .eq('id', id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ url: publicUrl })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '서버 오류' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'token 파라미터가 필요합니다' }, { status: 400 })
  }

  const projectRef = 'uqpfllbwgurgagkolshc'
  const sql = `
    ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_category_check;
    ALTER TABLE contents ADD CONSTRAINT contents_category_check
      CHECK (category IN ('기사', '에세이', '인터뷰', '시/수필', '독서감상문', '수행평가', '교사의 서재', '도서관'));
  `

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: '실패', detail: data }, { status: 500 })
  }

  return NextResponse.json({ success: true, result: data })
}

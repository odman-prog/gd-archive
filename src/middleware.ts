import { NextResponse } from 'next/server'

// 미들웨어 비활성화 - ByteString 오류 우회
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}

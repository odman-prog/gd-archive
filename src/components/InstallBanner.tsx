'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Platform = 'ios' | 'android' | null

export default function InstallBanner() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [dismissed, setDismissed] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt?: () => void } | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // 이미 설치됐으면 숨김
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // 이전에 닫았으면 숨김
    if (sessionStorage.getItem('pwa-banner-dismissed')) {
      setDismissed(true)
      return
    }

    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as { MSStream?: unknown }).MSStream
    const isAndroid = /android/i.test(ua)

    if (isIOS) setPlatform('ios')
    else if (isAndroid) setPlatform('android')

    // Android: beforeinstallprompt 이벤트 캡처
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt?: () => void })
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setDismissed(true)
    sessionStorage.setItem('pwa-banner-dismissed', '1')
  }

  async function handleInstall() {
    if (deferredPrompt?.prompt) {
      deferredPrompt.prompt()
      dismiss()
    }
  }

  if (installed || dismissed || !platform) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm bg-primary text-cream rounded-2xl shadow-2xl shadow-primary/30 overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            {/* 아이콘 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="앱 아이콘" className="w-11 h-11 rounded-xl shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm font-semibold text-cream leading-snug mb-0.5">
                광덕아카이브 앱 설치
              </p>

              {platform === 'ios' && (
                <p className="font-sans text-xs text-cream/65 leading-relaxed">
                  하단 <span className="text-secondary font-bold">공유 버튼</span>{' '}
                  <span className="text-cream/50">→</span>{' '}
                  <span className="text-secondary font-bold">홈 화면에 추가</span>를 탭하세요
                </p>
              )}

              {platform === 'android' && deferredPrompt && (
                <p className="font-sans text-xs text-cream/65 leading-relaxed">
                  홈 화면에 추가하면 앱처럼 사용할 수 있습니다
                </p>
              )}

              {platform === 'android' && !deferredPrompt && (
                <p className="font-sans text-xs text-cream/65 leading-relaxed">
                  브라우저 메뉴 <span className="text-secondary font-bold">⋮</span>{' '}
                  <span className="text-cream/50">→</span>{' '}
                  <span className="text-secondary font-bold">앱 설치</span>를 탭하세요
                </p>
              )}
            </div>

            <button onClick={dismiss} className="shrink-0 text-cream/40 hover:text-cream transition-colors mt-0.5">
              <X size={16} />
            </button>
          </div>

          {/* Android 직접 설치 버튼 */}
          {platform === 'android' && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="mt-3 w-full py-2.5 rounded-xl bg-secondary text-cream text-xs font-sans font-bold tracking-wide hover:bg-secondary/90 transition-colors"
            >
              홈 화면에 추가
            </button>
          )}

          {/* iOS 화살표 안내 */}
          {platform === 'ios' && (
            <div className="mt-3 flex items-center gap-2 bg-cream/8 rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">ios_share</span>
              <span className="font-sans text-[11px] text-cream/55">
                Safari 하단 가운데 공유 아이콘 탭
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

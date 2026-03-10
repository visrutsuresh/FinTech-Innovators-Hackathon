import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '@/components/layout/AuthContext'
import { ChatPanelProvider } from '@/components/layout/ChatPanelContext'
import { FeaturePanelProvider } from '@/components/layout/FeaturePanelContext'
import Navbar from '@/components/layout/Navbar'
import ChatPanel from '@/components/layout/ChatPanel'
import FeaturePanel from '@/components/layout/FeaturePanel'
import MainLayout from '@/components/layout/MainLayout'

const alteHaas = localFont({
  src: [
    { path: '../public/fonts/AlteHaasGroteskRegular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/AlteHaasGroteskBold.ttf',    weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-alte',
})

const ballet = localFont({
  src: '../public/fonts/Ballet-Regular-VariableFont_opsz.ttf',
  display: 'swap',
  variable: '--font-ballet',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Huat — Wealth Wellness Hub',
  description: 'Unified financial wellness for traditional and digital assets',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${alteHaas.variable} ${ballet.variable}`}>
      <body className={`${alteHaas.className} bg-[#080808] text-white min-h-screen`}>
        <AuthProvider>
          <ChatPanelProvider>
            <FeaturePanelProvider>
              <Navbar />
              <ChatPanel />
              <FeaturePanel />
              <MainLayout>{children}</MainLayout>
            </FeaturePanelProvider>
          </ChatPanelProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

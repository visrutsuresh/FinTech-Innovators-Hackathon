import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/layout/AuthContext'
import { ChatPanelProvider } from '@/components/layout/ChatPanelContext'
import Navbar from '@/components/layout/Navbar'
import ChatPanel from '@/components/layout/ChatPanel'
import MainLayout from '@/components/layout/MainLayout'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#080808] text-white min-h-screen`}>
        <AuthProvider>
          <ChatPanelProvider>
            <Navbar />
            <ChatPanel />
            <MainLayout>{children}</MainLayout>
          </ChatPanelProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

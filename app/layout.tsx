import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { PHProvider } from '@/components/providers/posthog-provider'
import { Toaster } from 'sonner'
import { AuthListener } from '@/components/providers/auth-listener'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Hoshin Kanri OS — Biến chiến lược thành hành động đo được trong 90 ngày',
  description: 'Công cụ quản lý chiến lược cho SME Việt Nam',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full font-sans antialiased`}
      >
        <PHProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthListener />
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </PHProvider>
      </body>
    </html>
  )
}

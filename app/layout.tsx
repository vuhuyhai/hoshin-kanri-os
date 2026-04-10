import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { PHProvider } from '@/components/providers/posthog-provider'
import { Toaster } from 'sonner'
import { AuthListener } from '@/components/providers/auth-listener'
import './globals.css'

export const metadata: Metadata = {
  title:
    'Hoshin Kanri OS — Biến chiến lược thành hành động đo được trong 90 ngày',
  description: 'Công cụ quản lý chiến lược cho SME Việt Nam',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@300;400;500;600;700&subset=vietnamese&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full font-body antialiased bg-bg-warm text-ink">
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

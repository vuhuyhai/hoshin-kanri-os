import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { PHProvider } from '@/components/providers/posthog-provider'
import { Toaster } from 'sonner'
import { AuthListener } from '@/components/providers/auth-listener'
import { Footer } from '@/components/layout/footer'
import { Montserrat, Barlow_Condensed } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

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
    <html lang="vi" className={`${montserrat.variable} ${barlowCondensed.variable} light`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="hoshin-theme-v2";var t=localStorage.getItem(k);if(!t||t==="system"||t==="dark"){localStorage.setItem(k,"light")}document.documentElement.classList.remove("dark");document.documentElement.classList.add("light");document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full font-body antialiased bg-bg-warm text-ink">
        <PHProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="hoshin-theme-v2"
            disableTransitionOnChange
          >
            <AuthListener />
            {children}
            <Footer />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </PHProvider>
      </body>
    </html>
  )
}

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

const SITE_URL = 'https://chienluoc.org'
const SITE_NAME = 'Hoshin Kanri OS'
const DEFAULT_TITLE =
  'Hoshin Kanri OS — Biến chiến lược thành hành động đo được trong 90 ngày'
const DEFAULT_DESCRIPTION =
  'Công cụ quản lý chiến lược dành cho SME Việt Nam: Hoshin Kanri, OKR, X-Matrix, SWOT và Business X-Ray chẩn đoán doanh nghiệp trong 10 phút.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | Hoshin Kanri OS',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Hoshin Kanri',
    'OKR',
    'X-Matrix',
    'SWOT',
    'chiến lược SME',
    'quản lý chiến lược',
    'Business X-Ray',
    'chiến lược doanh nghiệp Việt Nam',
    'Hoshin Kanri OS',
  ],
  authors: [{ name: 'Hoshin Kanri OS' }],
  creator: 'Hoshin Kanri OS',
  publisher: 'Hoshin Kanri OS',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: 'vi_VN',
    images: [
      {
        url: '/images/logo-light.png',
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/images/logo-light.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/images/logo-light.png`,
              description: DEFAULT_DESCRIPTION,
              sameAs: ['https://www.facebook.com/vuhai.fitness'],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
              inLanguage: 'vi-VN',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${SITE_URL}/blog?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
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

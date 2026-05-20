import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ResizeObserverFix } from '@/components/resize-observer-fix'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from './providers'
import './globals.css'

const _inter = Inter({ subsets: ["latin"], variable: "--font-sans-inter" });
const _jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-jb" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: 'Vulnerability Remediation — Executive Dashboard',
  description: 'CIO-level vulnerability remediation posture and SLA tracking',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <ResizeObserverFix />
        <Providers>
          <div
            className="src-dashboard"
            style={{ backgroundColor: "#F7F8FA", color: "#111827", minHeight: "100dvh" }}
          >
            {children}
          </div>
        </Providers>
        <Toaster richColors position="bottom-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

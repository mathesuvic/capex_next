import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'CapEx - Coelba',
  description: 'Created with v0',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/novo-icone-coelba.ico',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/novo-icone-coelba.ico',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/novo-icone-coelba.ico',
        type: 'image/svg+xml',
      },
    ],
    apple: '/novo-icone-coelba.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

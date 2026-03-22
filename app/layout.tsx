import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import '@fontsource/geist/100.css'
import '@fontsource/geist/200.css'
import '@fontsource/geist/300.css'
import '@fontsource/geist/400.css'
import '@fontsource/geist/500.css'
import '@fontsource/geist/600.css'
import '@fontsource/geist/700.css'
import '@fontsource/geist/800.css'
import '@fontsource/geist/900.css'
import '@fontsource/geist-mono/100.css'
import '@fontsource/geist-mono/200.css'
import '@fontsource/geist-mono/300.css'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/500.css'
import '@fontsource/geist-mono/600.css'
import '@fontsource/geist-mono/700.css'
import './globals.css'

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
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

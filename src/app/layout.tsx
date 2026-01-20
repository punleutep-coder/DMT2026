
import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/app--context'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'DocuFlow',
  description: 'Document Workflow Dashboard',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Khmer+OS+Battambang:wght@400;700&family=Khmer+Moul&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Source+Code+Pro:wght@400;600&family=Khmer+Rotanak+Traiy+B&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  )
}

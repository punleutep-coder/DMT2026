import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/app-context'
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  )
}

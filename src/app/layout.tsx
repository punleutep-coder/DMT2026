
import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/app-context'
import { Toaster } from '@/components/ui/toaster'
import ThemeProvider from '@/context/theme-provider'

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Khmer+OS+Battambang:wght@400;700&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Source+Code+Pro:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <AppProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  )
}

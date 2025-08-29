
'use client'

import { useEffect } from 'react'
import { useAppContext } from '@/hooks/use-app-context'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAppContext()

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(state.theme)
  }, [state.theme])

  return <>{children}</>
}

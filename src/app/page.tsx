
'use client'
import { useAppContext } from '@/hooks/use-app-context'
import LoginForm from '@/components/auth/login-form'
import Dashboard from '@/components/dashboard/dashboard'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { state } = useAppContext()
  const { currentUser, isInitialized } = state;

  if (!isInitialized) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-4">
           <Skeleton className="h-10 w-1/3 mx-auto" />
           <Skeleton className="h-8 w-full" />
           <Skeleton className="h-8 w-full" />
           <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  return (
    <main>
      {currentUser ? <Dashboard /> : <LoginForm />}
    </main>
  )
}

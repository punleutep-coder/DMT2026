
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppContext } from '@/hooks/use-app-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import AnimatedBackground from '../ui/animated-background'
import { Workflow } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Terminal } from 'lucide-react'
import { get, ref } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { Document, Log } from '@/lib/types'
import { initialColumnVisibility } from '@/lib/initial-data'

const formSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
})

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function LoginForm() {
  const { state, dispatch } = useAppContext()
  const [error, setError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: 'admin',
      password: 'admin',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null)
    setIsLoggingIn(true);
    const user = state.users.find((u) => u.username === values.username)
    if (user) {
      const passwordHash = await hashPassword(values.password)
      if (passwordHash === user.passwordHash) {
        try {
          // Fetch all data on successful login
          const dataSnapshot = await get(ref(db));
          const data = dataSnapshot.val();
          const documents: Document[] = data.documents ? Object.keys(data.documents).map(key => ({ id: key, firestoreId: key, ...data.documents[key] })) : [];
          const logs: Log[] = data.logs ? Object.keys(data.logs).map(key => ({ id: key, firestoreId: key, ...data.logs[key] })) : [];
          const columnVisibility = data.columnVisibility || initialColumnVisibility;

          dispatch({ type: 'LOGIN', payload: { user, documents, logs, columnVisibility } })
          toast({
            title: `Welcome, ${user.username}!`,
            description: 'You have successfully logged in.',
          })
          
        } catch(e) {
            console.error(e);
            setError("Failed to load application data.");
        } finally {
            setIsLoggingIn(false);
        }
        return
      }
    }
    setError('Invalid username or password.')
    setIsLoggingIn(false);
  }

  const isInitializing = !state.isInitialized;

  return (
    <>
      <AnimatedBackground />
      <div className="flex items-center justify-center min-h-screen">
        <div className="modal-content w-full max-w-sm p-8 space-y-6 glassmorphic-card">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center bg-primary/10 p-3 rounded-full">
              <Workflow className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">DocuFlow</h1>
            <p className="text-muted-foreground">Please sign in to continue</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isInitializing || isLoggingIn}>
                {isInitializing ? 'Initializing...' : isLoggingIn ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  )
}

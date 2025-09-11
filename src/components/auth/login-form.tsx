
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
import { Workflow } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Terminal } from 'lucide-react'
import { Checkbox } from '../ui/checkbox'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

const formSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  rememberMe: z.boolean().optional(),
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
  const t = useTranslation()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  })

  useEffect(() => {
    // This code runs only on the client, after the component has mounted.
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      form.setValue('username', rememberedUsername);
      form.setValue('rememberMe', true);
    }
  }, [form.setValue]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null)
    setIsLoggingIn(true);

    if (values.rememberMe) {
        localStorage.setItem('rememberedUsername', values.username);
    } else {
        localStorage.removeItem('rememberedUsername');
    }

    const user = state.users.find((u) => u.username === values.username)
    if (user) {
      const passwordHash = await hashPassword(values.password)
      if (passwordHash === user.passwordHash) {
        try {
          dispatch({ type: 'LOGIN', payload: { user } })
          toast({
            title: t('welcome', { username: user.username }),
            description: t('loggedInSuccess'),
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
    setError(t('invalidCredentials'))
    setIsLoggingIn(false);
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div className="modal-content w-full max-w-sm p-8 space-y-6 glassmorphic-card">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center bg-primary/10 p-3 rounded-full">
              <Workflow className="w-8 h-8 text-[#000066]" />
            </div>
            <h1 className="text-3xl font-bold text-[#000066]" style={{fontFamily: "'Khmer Rotanak Traiy B', serif", fontSize: '22px'}}>{t('docuFlowLogin')}</h1>
            <p className="text-muted-foreground">{t('pleaseSignIn')}</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('username')} {...field} className="shadow-inner shadow-md" />
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
                    <FormLabel>{t('password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="shadow-inner shadow-md" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="flex items-center">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          {t('rememberMe')}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>{t('loginFailed')}</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={!state.isInitialized || isLoggingIn}>
                {isLoggingIn ? t('loggingIn') : t('login')}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  )
}

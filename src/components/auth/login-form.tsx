
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
import { useTranslation } from '@/lib/i18n'
import { auth, db } from '@/lib/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { ref, set } from 'firebase/database'
import type { User } from '@/lib/types'

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  rememberMe: z.boolean().optional(),
})

export default function LoginForm() {
  const { state } = useAppContext()
  const [error, setError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast()
  const t = useTranslation()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      form.setValue('email', rememberedEmail);
      form.setValue('rememberMe', true);
    }
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null)
    setIsLoggingIn(true);

    if (values.rememberMe) {
        localStorage.setItem('rememberedEmail', values.email);
    } else {
        localStorage.removeItem('rememberedEmail');
    }

    try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        // onAuthStateChanged in AppContext will handle the rest
        toast({
            title: t('welcome', { username: values.email }),
            description: t('loggedInSuccess'),
        });
    } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
            // If user doesn't exist, offer to create a new account
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
                const newUser = userCredential.user;

                // Create a corresponding user profile in the Realtime Database
                const userProfile: Omit<User, 'id' | 'firestoreId'> = {
                    username: values.email.split('@')[0], // Default username from email
                    email: values.email,
                    role: 'User',
                    permissions: {},
                    departmentPermissions: [],
                    passwordHash: '', // Not used with Firebase Auth
                };

                await set(ref(db, 'users/' + newUser.uid), userProfile);
                
                toast({
                    title: 'Account Created',
                    description: 'New account created successfully. You are now logged in.',
                });

            } catch (creationError: any) {
                console.error("Error creating user:", creationError);
                setError(creationError.message || 'Failed to create a new account.');
            }
        } else {
            console.error("Error signing in:", e);
            setError(e.message || t('invalidCredentials'));
        }
    } finally {
        setIsLoggingIn(false);
    }
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} className="shadow-inner shadow-md" />
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
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? t('loggingIn') : t('login')}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  )
}

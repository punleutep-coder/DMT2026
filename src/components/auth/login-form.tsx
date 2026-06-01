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

type LoginFormValues = z.infer<typeof formSchema>

export default function LoginForm() {
  const { dispatch } = useAppContext()
  const [error, setError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast()
  const t = useTranslation()
  
  const form = useForm<LoginFormValues>({
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

  async function onSubmit(values: LoginFormValues) {
    setError(null)
    setIsLoggingIn(true);

    if (values.rememberMe) {
        localStorage.setItem('rememberedEmail', values.email);
    } else {
        localStorage.removeItem('rememberedEmail');
    }

    try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        // onAuthStateChanged in AppContext will handle setting the user and state
        toast({
            title: t('welcome', { username: values.email }),
            description: t('loggedInSuccess'),
        });
    } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
            // If user does not exist, try to create a new account for them
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
                const newUser = userCredential.user;

                // Create a corresponding user profile in the Realtime Database
                const userProfile: Omit<User, 'id' | 'firestoreId' | 'passwordHash'> & { email: string } = {
                    username: values.email.split('@')[0],
                    email: values.email,
                    role: 'User',
                    permissions: {},
                    departmentPermissions: [],
                    labelPermissions: [],
                };
                
                await set(ref(db, 'users/' + newUser.uid), userProfile);
                
                toast({
                    title: 'Account Created',
                    description: 'New account created successfully. You are now logged in.',
                });
                // onAuthStateChanged will handle the login after the user profile is created

            } catch (creationError: any) {
                console.error("Error creating user:", creationError);
                let errorMessage = 'Failed to create a new account.';
                if (creationError.code === 'auth/email-already-in-use') {
                    errorMessage = 'This email is already in use with a different password. Please try logging in again.';
                } else if (creationError.code === 'auth/weak-password') {
                     errorMessage = 'The password is too weak.';
                }
                setError(errorMessage);
            }
        } else if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
             setError(t('invalidCredentials'));
        } else {
            console.error("Error signing in:", e);
            setError(e.message || 'An unknown error occurred during login.');
        }
    } finally {
        setIsLoggingIn(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md space-y-8 glassmorphic-card p-8 sm:p-12 border-none shadow-2xl relative z-10">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center bg-primary p-4 rounded-3xl shadow-xl shadow-primary/20 transform hover:scale-110 transition-transform duration-500">
            <Workflow className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-primary font-headline tracking-tighter uppercase">{t('docuFlowLogin')}</h1>
            <p className="text-muted-foreground font-body font-medium">{t('pleaseSignIn')}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-primary/80 font-body">{t('email')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="user@example.com" 
                        {...field} 
                        className="h-12 bg-white/50 border-white/40 focus:bg-white transition-all font-body rounded-xl shadow-sm" 
                      />
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
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-primary/80 font-body">{t('password')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="h-12 bg-white/50 border-white/40 focus:bg-white transition-all font-body rounded-xl shadow-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary rounded-md"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-bold text-muted-foreground cursor-pointer font-body uppercase tracking-tighter">
                      {t('rememberMe')}
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5 animate-in fade-in slide-in-from-top-4 duration-300">
                <Terminal className="h-4 w-4" />
                <AlertTitle className="font-bold font-body">{t('loginFailed')}</AlertTitle>
                <AlertDescription className="text-xs font-body font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-black text-lg uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 transform active:scale-95" 
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loggingIn')}
                </div>
              ) : t('login')}
            </Button>
          </form>
        </Form>

        <div className="pt-4 text-center">
          <p className="text-[10px] text-muted-foreground font-body font-bold uppercase tracking-[0.2em]">Powered by Advanced Workflow Engine</p>
        </div>
      </div>
    </div>
  )
}

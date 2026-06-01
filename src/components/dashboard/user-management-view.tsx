'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { PERMISSIONS_CONFIG } from '@/lib/initial-data'
import { Checkbox } from '../ui/checkbox'
import { Pencil, Shield, Trash2, KeyRound, ChevronLeft, UserPlus } from 'lucide-react'
import type { User } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { cn } from '@/lib/utils'

const permissionsSchema = z.object(
    Object.keys(PERMISSIONS_CONFIG).reduce(
      (acc, key) => {
        acc[key] = z.boolean().default(false).optional()
        return acc
      },
      {} as Record<string, z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>
    )
  ).optional()

const formSchema = z
  .object({
    id: z.string().optional(),
    username: z.string().min(1, 'Username is required.'),
    email: z.string().email(),
    password: z.string().optional(),
    role: z.enum(['Admin', 'User']),
    permissions: permissionsSchema,
    departmentPermissions: z.array(z.string()).default([]),
    labelPermissions: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      const isNewUser = !data.id
      if (isNewUser) {
        return data.password && data.password.length >= 6
      }
      return true
    },
    {
      message: 'Password is required for new users and must be at least 6 characters.',
      path: ['password'],
    }
  )

type UserFormValues = z.infer<typeof formSchema>

const permissionGroups = {
  dashboardPermissions: [ 'canViewMetrics', 'canViewWorkflowChart' ],
  generalDocPermissions: [ 'canAddDocument', 'canCombineDocuments', 'canSplitDocument', 'canDeleteDocument', 'canViewLog', 'canExportData', 'canManageColumns', 'canViewCompleted' ],
  docActionPermissions: [ 'canMoveDocumentAdvance', 'canMoveDocumentBack', 'canCompleteDocument', 'canDelayDocument', 'canReleaseDocument', 'canEditCurrentNote' ],
  docFieldEditPermissions: [ 
    'canEditDocumentId', 'canEditDocumentName', 'canEditDocumentType', 'canEditLabel', 'canEditAssignedDepartment', 
    'canEditSecondaryId', 'canEditTertiaryId', 'canEditQuaternaryId', 'canEditQuinaryId', 'canEditSenaryId',
    'canEditSeptenaryId', 'canEditOctonaryId', 'canEditNonaryId', 'canEditDenaryId',
    'canEditKeywords', 'canEditTags', 'canEditInitialNote' 
  ],
  docLinkPermissions: [ 
    'canOpenDocumentLink1', 'canOpenDocumentLink2', 'canOpenDocumentLink3', 'canOpenDocumentLink4', 'canOpenDocumentLink5', 'canOpenDocumentLink6', 'canOpenDocumentLink7', 'canOpenDocumentLink8', 'canOpenDocumentLink9', 'canOpenDocumentLink10',
    'canEditDocumentLink1', 'canEditDocumentLink2', 'canEditDocumentLink3', 'canEditDocumentLink4', 'canEditDocumentLink5', 'canEditDocumentLink6', 'canEditDocumentLink7', 'canEditDocumentLink8', 'canEditDocumentLink9', 'canEditDocumentLink10'
  ],
  adminPermissions: ['canManageAdmins', 'canViewGlobalActivity']
};

export default function UserManagementView() {
  const { state, dispatch } = useAppContext()
  const { currentUser } = state
  const { toast } = useToast()
  const t = useTranslation()
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined)

  const mode = editingUserId ? 'edit' : 'add'
  const userToEdit = state.users.find((u) => u.id === editingUserId)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      username: '',
      email: '',
      password: '',
      role: 'User' as const,
      permissions: Object.keys(PERMISSIONS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      departmentPermissions: [],
      labelPermissions: [],
    },
  })

  useEffect(() => {
    if (editingUserId) {
      const user = state.users.find((u) => u.id === editingUserId)
      if (user) {
        form.reset({
          id: user.id,
          username: user.username,
          email: user.email,
          password: '',
          role: user.role,
          permissions: user.permissions || Object.keys(PERMISSIONS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
          departmentPermissions: user.departmentPermissions || [],
          labelPermissions: user.labelPermissions || [],
        })
      }
    } else {
      form.reset({
        id: undefined,
        username: '',
        email: '',
        password: '',
        role: 'User' as const,
        permissions: Object.keys(PERMISSIONS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
        departmentPermissions: [],
        labelPermissions: [],
      })
    }
  }, [editingUserId, state.users, form])

  const role = form.watch('role')

  const handleSetEditMode = (user: User) => {
    if (currentUser?.id === user.id) {
      toast({ title: 'Error', description: 'You cannot edit your own account from this panel.', variant: 'destructive' });
      return;
    }
    if (user.role === 'Admin' && currentUser?.role === 'Admin' && !(currentUser.permissions?.canManageAdmins)) {
       toast({ title: 'Permission Denied', description: 'You do not have permission to edit other Admins.', variant: 'destructive' });
       return;
    }
    setEditingUserId(user.id)
  }

  const handleSetAddMode = () => {
    setEditingUserId(undefined)
  }

  const handleResetPassword = async (user: User) => {
    if (!canManageUser(user)) {
      toast({ title: 'Permission Denied', description: 'You do not have permission to reset this user\'s password.', variant: 'destructive' });
      return;
    }

    if (!user.email) {
      toast({
        title: 'Missing Email',
        description: `Cannot send password reset because user ${user.username} does not have an email address.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: `A password reset link has been sent to ${user.email}.`,
      });
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      toast({
        title: 'Error',
        description: 'Could not send password reset email. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = (user: User) => {
    if (currentUser?.id === user.id) {
        toast({ title: 'Error', description: 'You cannot delete your own account.', variant: 'destructive' });
        return;
    }
     if (user.role === 'Admin' && currentUser?.role === 'Admin' && !(currentUser.permissions?.canManageAdmins)) {
        toast({ title: 'Permission Denied', description: 'You do not have permission to delete other Admins.', variant: 'destructive' });
        return;
    }

    dispatch({
      type: 'SET_DIALOG',
      payload: {
        isOpen: true,
        title: 'Delete User',
        message: `Are you sure you want to delete user '${user.username}'? This action is permanent and cannot be undone.`,
        confirmText: 'Delete',
        onConfirm: () => {
          dispatch({ type: 'DELETE_USER', payload: { id: user.id } })
          if (editingUserId === user.id) {
            handleSetAddMode()
          }
          toast({
            title: 'User Deleted from Database',
            description: `User ${user.username} has been removed.`,
          })
        },
      },
    })
  }
  
  const onSubmit = async (values: UserFormValues) => {
    const isUpdating = !!values.id;

    if (isUpdating) {
        const targetUser = state.users.find(u => u.id === values.id);
        if (!targetUser) {
            toast({ title: 'Error', description: 'User not found.', variant: 'destructive' });
            return;
        }
        
        if (targetUser.role === 'Admin' && currentUser?.role === 'Admin' && !(currentUser.permissions?.canManageAdmins)) {
            toast({ title: 'Permission Denied', description: 'You cannot edit other Admin users.', variant: 'destructive' });
            return;
        }

        const allPermissionKeys = Object.keys(PERMISSIONS_CONFIG);
        const finalPermissions: { [key: string]: boolean } = {};

        if (values.role === 'User') {
          allPermissionKeys.forEach(key => {
            finalPermissions[key] = values.permissions?.[key as keyof typeof values.permissions] ?? false;
          });
        }
        
        const finalDepartmentPermissions = values.role === 'Admin' ? [] : values.departmentPermissions;
        const finalLabelPermissions = values.role === 'Admin' ? [] : values.labelPermissions;
        
        const userData: User = {
            id: values.id!,
            firestoreId: targetUser.firestoreId,
            username: values.username,
            email: values.email,
            role: values.role,
            permissions: finalPermissions,
            departmentPermissions: finalDepartmentPermissions,
            labelPermissions: finalLabelPermissions,
            passwordHash: '', 
        };
        
        if (userData.role === 'Admin') {
            userData.permissions.canManageAdmins = true;
        }
        
        dispatch({ type: 'UPDATE_USER', payload: userData });
        toast({ title: 'Success', description: 'User updated successfully.' });

        handleSetAddMode();
    } else {
        if (!values.password) {
            form.setError('password', { message: 'Password is required for new users.' });
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const authUser = userCredential.user;

            const allPermissionKeys = Object.keys(PERMISSIONS_CONFIG);
            const finalPermissions: { [key: string]: boolean } = {};

            if (values.role === 'User') {
              allPermissionKeys.forEach(key => {
                finalPermissions[key] = values.permissions?.[key as keyof typeof values.permissions] ?? false;
              });
            }
            const finalDepartmentPermissions = values.role === 'Admin' ? [] : values.departmentPermissions;
            const finalLabelPermissions = values.role === 'Admin' ? [] : values.labelPermissions;


            const newUserProfile: User = {
                id: authUser.uid,
                firestoreId: authUser.uid,
                username: values.username,
                email: values.email,
                role: values.role,
                permissions: finalPermissions,
                departmentPermissions: finalDepartmentPermissions,
                labelPermissions: finalLabelPermissions,
                passwordHash: '', 
            };
            if (newUserProfile.role === 'Admin') {
                newUserProfile.permissions.canManageAdmins = true;
            }

            dispatch({ type: 'ADD_USER', payload: newUserProfile });
            toast({ title: 'User Created', description: `${values.username} has been added.` });
            handleSetAddMode();

        } catch (error: any) {
            console.error("Error creating user:", error);
            if (error.code === 'auth/email-already-in-use') {
                form.setError('email', { message: 'This email is already in use.' });
            } else {
                toast({ title: 'Error creating user', description: error.message, variant: 'destructive' });
            }
        }
    }
  }
  
  const canManageUser = (userToManage: User) => {
    if (!currentUser) return false;
    if (currentUser.id === userToManage.id) return false;
    if (currentUser.role === 'Admin' && currentUser.permissions?.canManageAdmins) return true;
    if (currentUser.role === 'Admin' && userToManage.role === 'User') return true;
    return false;
  }
  
  const canSetRole = (roleToSet: 'Admin' | 'User') => {
      if (!currentUser) return false;
      if (currentUser.role === 'Admin' && currentUser.permissions?.canManageAdmins) return true;
      if (currentUser.role === 'Admin' && roleToSet === 'User') return true;
      return false;
  }

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 p-6 border-b border-white/20 bg-white/40">
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
            className="rounded-full hover:bg-white/20"
        >
            <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-black text-primary font-headline uppercase tracking-tight">{t('userManagement')}</h2>
          <p className="text-sm font-body font-medium text-muted-foreground">{t('userManagementDesc')}</p>
        </div>
        <Button onClick={handleSetAddMode} className="rounded-full gap-2 shadow-lg shadow-primary/20">
          <UserPlus className="h-4 w-4" />
          {t('addNewUser')}
        </Button>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-5 overflow-hidden">
        {/* Left Side: User List */}
        <div className="md:col-span-2 border-r border-white/20 flex flex-col bg-white/5">
          <div className="p-4 border-b border-white/10 bg-white/10">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary font-body">{t('existingUsers')}</h3>
          </div>
          <ScrollArea className="flex-grow p-4">
            <div className="space-y-3">
              {state.users.sort((a,b) => a.username.localeCompare(b.username)).map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "group flex items-center justify-between rounded-2xl p-4 transition-all duration-300 font-body cursor-pointer",
                    editingUserId === user.id ? "bg-primary text-white shadow-xl scale-[1.02]" : "bg-white/40 hover:bg-white/60 border border-white/20"
                  )}
                  onClick={() => handleSetEditMode(user)}
                >
                  <div className="overflow-hidden">
                    <span className="font-bold block truncate text-base">{user.username}</span>
                    <p className={cn("text-xs truncate", editingUserId === user.id ? "text-white/80" : "text-muted-foreground")}>{user.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={cn(
                        "text-[10px] uppercase font-black px-2 py-0.5 rounded",
                        editingUserId === user.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                      )}>
                        {t(user.role as 'Admin' | 'User')}
                      </span>
                    </div>
                  </div>
                  {canManageUser(user) && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-9 w-9 rounded-full", editingUserId === user.id ? "hover:bg-white/20 text-white" : "hover:bg-blue-50 text-blue-600")}
                          onClick={() => handleResetPassword(user)}
                          title="Send Password Reset"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-9 w-9 rounded-full text-destructive hover:bg-rose-50", editingUserId === user.id ? "text-white hover:bg-white/20" : "")}
                          onClick={() => handleDeleteUser(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Form */}
        <div className="md:col-span-3 flex flex-col overflow-hidden bg-white/20 backdrop-blur-sm">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/10">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary font-body">
              {mode === 'edit'
                ? t('editUser', { username: userToEdit?.username })
                : t('addNewUser')}
            </h3>
            {mode === 'edit' && (
              <Button size="sm" variant="outline" onClick={handleSetAddMode} className="h-8 px-4 text-xs rounded-full bg-white/50 border-white/30 font-body">
                {t('cancelEdit')}
              </Button>
            )}
          </div>
          
          <ScrollArea className="flex-grow">
            <div className="p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest font-body">{t('username')}</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white/50 border-white/30 h-11 text-sm font-body rounded-xl shadow-inner" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest font-body">Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} readOnly={mode === 'edit'} className="bg-white/50 border-white/30 h-11 text-sm font-body rounded-xl shadow-inner" />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest font-body">{t('password')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="bg-white/50 border-white/30 h-11 text-sm font-body rounded-xl shadow-inner" />
                          </FormControl>
                          <FormDescription className="text-[10px] font-body leading-tight">
                            {mode === 'edit' ? t('leaveBlankPassword') : t('passwordRequired')}
                          </FormDescription>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest font-body">{t('role')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white/50 border-white/30 h-11 text-sm font-body rounded-xl shadow-inner">
                                <SelectValue placeholder={t('role')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="font-body rounded-xl border-white/20">
                              {canSetRole('Admin') && <SelectItem value="Admin">Admin</SelectItem>}
                              {canSetRole('User') && <SelectItem value="User">User</SelectItem>}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {role === 'User' ? (
                    <div className="space-y-8 pt-4 border-t border-white/20">
                      {Object.entries(permissionGroups).map(
                        ([groupKey, permissionKeys]) => (
                          <div
                            key={groupKey}
                            className="space-y-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-1 w-10 bg-primary rounded-full shadow-lg shadow-primary/20" />
                              <h3 className="font-black text-sm uppercase tracking-tighter text-primary font-body">
                                {t(groupKey as any)}
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white/10 p-6 rounded-3xl border border-white/10 shadow-inner">
                              {permissionKeys.map((key) => (
                                <FormField
                                  key={key}
                                  control={form.control}
                                  name={`permissions.${key as keyof typeof PERMISSIONS_CONFIG}`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2.5 rounded-xl hover:bg-white/30 transition-all cursor-pointer group">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          className="h-4 w-4 data-[state=checked]:bg-primary font-body rounded-md"
                                        />
                                      </FormControl>
                                      <FormLabel className="font-bold text-xs cursor-pointer flex-1 font-body text-balance">
                                        {t(key as any)}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1 w-10 bg-primary rounded-full shadow-lg shadow-primary/20" />
                          <h3 className="font-black text-sm uppercase tracking-tighter text-primary font-body">
                            {t('deptAccessPermissions')}
                          </h3>
                        </div>
                        <div className="bg-white/10 p-6 rounded-3xl border border-white/10 shadow-inner">
                          <p className="text-xs text-muted-foreground mb-4 font-body italic">
                            {t('deptAccessDesc')}
                          </p>
                          <FormField
                              control={form.control}
                              name="departmentPermissions"
                              render={() => (
                                  <FormItem>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {state.departments.map((dept) => (
                                      <FormField
                                          key={dept}
                                          control={form.control}
                                          name="departmentPermissions"
                                          render={({ field }) => {
                                          const isChecked = field.value?.includes(dept);
                                          return (
                                              <FormItem
                                                key={dept}
                                                className={cn(
                                                  "flex flex-row items-center space-x-3 space-y-0 p-2.5 rounded-xl transition-all cursor-pointer",
                                                  isChecked ? "bg-primary/20 border border-primary/20" : "hover:bg-white/30"
                                                )}
                                              >
                                              <FormControl>
                                                  <Checkbox
                                                  checked={isChecked}
                                                  onCheckedChange={(checked) => {
                                                      const currentValue = field.value || [];
                                                      return checked
                                                      ? field.onChange([...currentValue, dept])
                                                      : field.onChange(
                                                          currentValue.filter(
                                                              (value) => value !== dept
                                                          )
                                                          );
                                                  }}
                                                  className="h-4 w-4 data-[state=checked]:bg-primary font-body rounded-md"
                                                  />
                                              </FormControl>
                                              <FormLabel className="font-bold text-xs cursor-pointer flex-1 font-body">
                                                  {dept}
                                              </FormLabel>
                                              </FormItem>
                                          );
                                          }}
                                      />
                                      ))}
                                  </div>
                                  <FormMessage className="text-[10px]" />
                                  </FormItem>
                              )}
                              />
                        </div>
                      </div>

                      <div className="space-y-4 pb-12">
                        <div className="flex items-center gap-3">
                          <div className="h-1 w-10 bg-primary rounded-full shadow-lg shadow-primary/20" />
                          <h3 className="font-black text-sm uppercase tracking-tighter text-primary font-body">
                            {t('labelAccessPermissions')}
                          </h3>
                        </div>
                        <div className="bg-white/10 p-6 rounded-3xl border border-white/10 shadow-inner">
                          <p className="text-xs text-muted-foreground mb-4 font-body italic">
                            {t('labelAccessDesc')}
                          </p>
                          <FormField
                              control={form.control}
                              name="labelPermissions"
                              render={() => (
                                  <FormItem>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {state.labels.map((label) => (
                                      <FormField
                                          key={label}
                                          control={form.control}
                                          name="labelPermissions"
                                          render={({ field }) => {
                                          const isChecked = field.value?.includes(label);
                                          return (
                                              <FormItem
                                                key={label}
                                                className={cn(
                                                  "flex flex-row items-center space-x-3 space-y-0 p-2.5 rounded-xl transition-all cursor-pointer",
                                                  isChecked ? "bg-primary/20 border border-primary/20" : "hover:bg-white/30"
                                                )}
                                              >
                                              <FormControl>
                                                  <Checkbox
                                                  checked={isChecked}
                                                  onCheckedChange={(checked) => {
                                                      const currentValue = field.value || [];
                                                      return checked
                                                      ? field.onChange([...currentValue, label])
                                                      : field.onChange(
                                                          currentValue.filter(
                                                              (value) => value !== label
                                                          )
                                                          );
                                                  }}
                                                  className="h-4 w-4 data-[state=checked]:bg-primary font-body rounded-md"
                                                  />
                                              </FormControl>
                                              <FormLabel className="font-bold text-xs cursor-pointer flex-1 font-body">
                                                  {label}
                                              </FormLabel>
                                              </FormItem>
                                          );
                                          }}
                                      />
                                      ))}
                                  </div>
                                  <FormMessage className="text-[10px]" />
                                  </FormItem>
                              )}
                              />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground p-8 border-2 border-dashed border-primary/30 rounded-3xl bg-primary/5 mt-8 animate-pulse text-center">
                      <div className='flex flex-col items-center gap-4'>
                          <div className="bg-primary/10 p-6 rounded-full">
                            <Shield className="h-12 w-12 text-primary" />
                          </div>
                        <div>
                          <h4 className="text-xl font-black text-primary font-headline uppercase tracking-widest">{t(role as 'Admin' | 'User')}</h4>
                          <p className="text-sm font-body max-w-[200px]">{t('allHaveAccess')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </div>
          </ScrollArea>
          
          <div className="p-6 border-t border-white/20 flex justify-end gap-3 bg-white/30 backdrop-blur-xl">
            <Button type="button" variant="ghost" onClick={handleSetAddMode} className="rounded-full h-11 px-8 font-body font-bold">
                {mode === 'edit' ? t('cancelEdit') : t('clearForm')}
            </Button>

            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="rounded-full h-11 px-10 shadow-xl shadow-primary/20 transition-all font-body font-black uppercase tracking-widest">
              {mode === 'edit' ? t('saveChanges') : t('addUser')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

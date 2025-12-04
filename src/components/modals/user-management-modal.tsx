
'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Pencil, Shield, Trash2, KeyRound } from 'lucide-react'
import type { User } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { v4 as uuidv4 } from 'uuid'
import { FormDescription } from '../ui/form'
import { useTranslation } from '@/lib/i18n'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'

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

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
}

const permissionGroups = {
  dashboardPermissions: [ 'canViewMetrics', 'canViewWorkflowChart' ],
  generalDocPermissions: [ 'canAddDocument', 'canCombineDocuments', 'canSplitDocument', 'canDeleteDocument', 'canViewLog', 'canExportData', 'canManageColumns', 'canViewCompleted' ],
  docActionPermissions: [ 'canMoveDocument', 'canCompleteDocument', 'canDelayDocument', 'canReleaseDocument', 'canEditCurrentNote' ],
  docFieldEditPermissions: [ 'canEditDocumentId', 'canEditDocumentName', 'canEditDocumentType', 'canEditOffice', 'canEditAssignedDepartment', 'canEditSecondaryId', 'canEditTertiaryId', 'canEditQuaternaryId', 'canEditKeywords', 'canEditTags', 'canEditInitialNote' ],
  docLinkPermissions: [ 'canOpenDocumentLink1', 'canOpenDocumentLink2', 'canOpenDocumentLink3', 'canOpenDocumentLink4', 'canEditDocumentLink1', 'canEditDocumentLink2', 'canEditDocumentLink3', 'canEditDocumentLink4' ],
  adminPermissions: ['canManageAdmins', 'canViewGlobalActivity']
};

export default function UserManagementModal({
  isOpen,
  onClose,
  userId: initialUserId,
}: UserManagementModalProps) {
  const { state, dispatch } = useAppContext()
  const { currentUser } = state
  const { toast } = useToast()
  const t = useTranslation()
  const [editingUserId, setEditingUserId] = useState<string | undefined>(
    initialUserId
  )

  const mode = editingUserId ? 'edit' : 'add'
  const userToEdit = state.users.find((u) => u.id === editingUserId)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      username: '',
      email: '',
      password: '',
      role: 'User' as const,
      permissions: Object.keys(PERMISSIONS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      departmentPermissions: [],
    },
  })

  useEffect(() => {
    if (initialUserId) {
      const user = state.users.find((u) => u.id === initialUserId)
      if (user) {
        setEditingUserId(initialUserId)
        form.reset({
          id: user.id,
          username: user.username,
          email: user.email,
          password: '',
          role: user.role,
          permissions: user.permissions || Object.keys(PERMISSIONS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
          departmentPermissions: user.departmentPermissions || [],
        })
      }
    } else {
      setEditingUserId(undefined)
      form.reset({
        id: undefined,
        username: '',
        email: '',
        password: '',
        role: 'User' as const,
        permissions: Object.keys(PERMISSIONS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
        departmentPermissions: [],
      })
    }
  }, [initialUserId, state.users, form])

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
    form.reset({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      permissions: user.permissions || Object.keys(PERMISSIONS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      departmentPermissions: user.departmentPermissions || [],
    })
  }

  const handleSetAddMode = () => {
    setEditingUserId(undefined)
    form.reset({
      id: undefined,
      username: '',
      email: '',
      password: '',
      role: 'User' as const,
      permissions: Object.keys(PERMISSIONS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      departmentPermissions: [],
    })
  }

  const handleResetPassword = async (user: User) => {
    if (!canManageUser(user)) {
      toast({ title: 'Permission Denied', description: 'You do not have permission to reset this user\'s password.', variant: 'destructive' });
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
          // Note: This only deletes from RTDB. The user will still exist in Firebase Auth.
          // A full solution would involve a backend function to delete the auth user.
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
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
        
        const userData: User = {
            id: values.id!,
            firestoreId: targetUser.firestoreId,
            username: values.username,
            email: values.email,
            role: values.role,
            permissions: finalPermissions,
            departmentPermissions: finalDepartmentPermissions,
            passwordHash: '', // Not used
        };
        
        if (userData.role === 'Admin') {
            userData.permissions.canManageAdmins = true;
        }
        
        dispatch({ type: 'UPDATE_USER', payload: userData });
        toast({ title: 'Success', description: 'User updated successfully.' });

        handleSetAddMode();
    } else {
        // Add new user
        if (!values.password) {
            form.setError('password', { message: 'Password is required for new users.' });
            return;
        }
        try {
            // Step 1: Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const authUser = userCredential.user;

            // Step 2: Create user profile in Realtime Database
            const allPermissionKeys = Object.keys(PERMISSIONS_CONFIG);
            const finalPermissions: { [key: string]: boolean } = {};

            if (values.role === 'User') {
              allPermissionKeys.forEach(key => {
                finalPermissions[key] = values.permissions?.[key as keyof typeof values.permissions] ?? false;
              });
            }
            const finalDepartmentPermissions = values.role === 'Admin' ? [] : values.departmentPermissions;

            const newUserProfile: User = {
                id: authUser.uid,
                firestoreId: authUser.uid,
                username: values.username,
                email: values.email,
                role: values.role,
                permissions: finalPermissions,
                departmentPermissions: finalDepartmentPermissions,
                passwordHash: '', // Not used
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle>{t('userManagement')}</DialogTitle>
          <DialogDescription>
            {t('userManagementDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t('existingUsers')}</h3>
            <ScrollArea className="h-[60vh] p-2 border rounded-md">
              <div className="space-y-2">
                {state.users.sort((a,b) => a.username.localeCompare(b.username)).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-md p-2 bg-muted/50"
                  >
                    <div>
                      <span className="font-medium">{user.username}</span>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({t(user.role as 'Admin' | 'User')})
                      </span>
                    </div>
                    {canManageUser(user) && (
                      <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleResetPassword(user)}
                            title="Send Password Reset"
                          >
                            <KeyRound className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleSetEditMode(user)}
                          >
                            <Pencil className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
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
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              {mode === 'edit'
                ? t('editUser', { username: userToEdit?.username })
                : t('addNewUser')}
            </h3>
            <ScrollArea className="h-[60vh] p-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('username')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} readOnly={mode === 'edit'} />
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
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            {mode === 'edit' ? t('leaveBlankPassword') : t('passwordRequired')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('role')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('role')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {canSetRole('Admin') && <SelectItem value="Admin">Admin</SelectItem>}
                              {canSetRole('User') && <SelectItem value="User">User</SelectItem>}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {role === 'User' ? (
                    <div className="space-y-6">
                      {Object.entries(permissionGroups).map(
                        ([groupKey, permissionKeys]) => (
                          <div
                            key={groupKey}
                            className="space-y-4 p-4 border rounded-md"
                          >
                            <h3 className="font-semibold text-foreground">
                              {t(groupKey as any)}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {permissionKeys.map((key) => (
                                <FormField
                                  key={key}
                                  control={form.control}
                                  name={`permissions.${key as keyof typeof PERMISSIONS_CONFIG}`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
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

                      <div className="p-4 border rounded-md space-y-4">
                        <h3 className="font-semibold text-foreground">
                          {t('deptAccessPermissions')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t('deptAccessDesc')}
                        </p>
                        <FormField
                            control={form.control}
                            name="departmentPermissions"
                            render={() => (
                                <FormItem>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {state.departments.map((dept) => (
                                    <FormField
                                        key={dept}
                                        control={form.control}
                                        name="departmentPermissions"
                                        render={({ field }) => {
                                        return (
                                            <FormItem
                                            key={dept}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                            <FormControl>
                                                <Checkbox
                                                checked={field.value?.includes(dept)}
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
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                {dept}
                                            </FormLabel>
                                            </FormItem>
                                        );
                                        }}
                                    />
                                    ))}
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground p-4 border rounded-md bg-muted/30">
                      <div className='text-center'>
                        <Shield className="mx-auto h-8 w-8 text-primary" />
                        <p className="mt-2 font-medium">{t(role as 'Admin' | 'User')} {t('allHaveAccess')}</p>
                      </div>
                    </div>
                  )}
                   <DialogFooter className="pt-4 flex-row justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={handleSetAddMode}>
                        {mode === 'edit' ? t('cancelEdit') : t('clearForm')}
                    </Button>

                    <Button type="submit">
                      {mode === 'edit' ? t('saveChanges') : t('addUser')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

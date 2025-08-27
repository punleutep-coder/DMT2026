
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
  DialogFooter,
  DialogDescription,
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
import { Pencil, Shield, Trash2 } from 'lucide-react'
import type { User } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { v4 as uuidv4 } from 'uuid'
import { FormDescription } from '../ui/form'
import { cn } from '@/lib/utils'

const permissionsSchema = z.record(z.boolean()).default({})

const formSchema = z
  .object({
    id: z.string().optional(),
    username: z.string().min(1, 'Username is required.'),
    password: z.string().optional(),
    role: z.enum(['Admin', 'User']),
    permissions: permissionsSchema,
    departmentPermissions: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      const isNewUser = !data.id
      if (isNewUser) {
        return data.password && data.password.length > 0
      }
      return true
    },
    {
      message: 'Password is required for new users.',
      path: ['password'],
    }
  )

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
}

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const permissionGroups = {
  'Document Permissions': Object.entries(PERMISSIONS_CONFIG)
    .filter(([key]) => !key.startsWith('canOpenDocumentLink') && key !== 'canManageAdmins')
    .map(([key, name]) => ({ key, name })),
  'Open Document Link Permissions': Object.entries(PERMISSIONS_CONFIG)
    .filter(([key]) => key.startsWith('canOpenDocumentLink'))
    .map(([key, name]) => ({ key, name })),
}

export default function UserManagementModal({
  isOpen,
  onClose,
  userId: initialUserId,
}: UserManagementModalProps) {
  const { state, dispatch } = useAppContext()
  const { currentUser } = state
  const { toast } = useToast()
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
      password: '',
      role: 'User' as const,
      permissions: {},
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
          password: '',
          role: user.role,
          permissions: user.permissions || {},
          departmentPermissions: user.departmentPermissions || [],
        })
      }
    } else {
      setEditingUserId(undefined)
      form.reset({
        id: undefined,
        username: '',
        password: '',
        role: 'User' as const,
        permissions: {},
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
    setEditingUserId(user.id)
    form.reset({
      id: user.id,
      username: user.username,
      password: '',
      role: user.role,
      permissions: user.permissions || {},
      departmentPermissions: user.departmentPermissions || [],
    })
  }

  const handleSetAddMode = () => {
    setEditingUserId(undefined)
    form.reset({
      id: undefined,
      username: '',
      password: '',
      role: 'User' as const,
      permissions: {},
      departmentPermissions: [],
    })
  }

  const handleDeleteUser = (user: User) => {
    if (currentUser?.id === user.id) {
        toast({ title: 'Error', description: 'You cannot delete your own account.', variant: 'destructive' });
        return;
    }
     if (currentUser?.role === 'Admin' && user.role === 'Admin') {
        if(!currentUser.permissions.canManageAdmins) {
            toast({ title: 'Permission Denied', description: 'You do not have permission to delete other admins.', variant: 'destructive' });
            return;
        }
    }

    dispatch({
      type: 'SET_DIALOG',
      payload: {
        isOpen: true,
        title: 'Delete User',
        message: `Are you sure you want to delete user '${user.username}'? This action cannot be undone.`,
        confirmText: 'Delete',
        onConfirm: () => {
          dispatch({ type: 'DELETE_USER', payload: { id: user.id } })
          if (editingUserId === user.id) {
            handleSetAddMode()
          }
          toast({
            title: 'User Deleted',
            description: `User ${user.username} has been removed.`,
          })
        },
      },
    })
  }
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const isUpdating = !!values.id;

    if (!isUpdating && state.users.some(u => u.username.toLowerCase() === values.username.toLowerCase())) {
        form.setError('username', { message: 'This username is already taken.' });
        return;
    }
    
    if (currentUser?.role === 'Admin' && isUpdating && values.role === 'Admin' && !currentUser.permissions.canManageAdmins) {
        const targetUser = state.users.find(u => u.id === values.id);
        if(targetUser?.role === 'Admin') {
            toast({ title: 'Permission Denied', description: 'You cannot edit other Admin users.', variant: 'destructive' });
            return;
        }
    }

    let passwordHash = isUpdating ? state.users.find(u => u.id === values.id)?.passwordHash : undefined;
    if (values.password && values.password.length > 0) {
        passwordHash = await hashPassword(values.password);
    }
    
    if (!passwordHash && !isUpdating) {
        form.setError('password', { message: 'Password is required for new users.' });
        return;
    }
    
    const userData: User = {
        id: isUpdating ? values.id! : `user-${uuidv4()}`,
        firestoreId: isUpdating ? state.users.find(u=>u.id === values.id)!.firestoreId : `user-${uuidv4()}`,
        username: values.username,
        role: values.role,
        permissions: values.role === 'User' ? values.permissions : {},
        departmentPermissions: values.role === 'User' ? values.departmentPermissions : [],
        passwordHash: passwordHash!,
    };
    
    if (isUpdating) {
        dispatch({ type: 'UPDATE_USER', payload: userData });
        toast({ title: 'Success', description: 'User updated successfully.' });
    } else {
        dispatch({ type: 'ADD_USER', payload: userData });
        toast({ title: 'Success', description: 'User created successfully.' });
    }

    handleSetAddMode();
  }
  
  const canManageUser = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.id === user.id) return false; // Cannot manage self
    if (currentUser.role === 'Admin') return true;
    return false;
  }
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
          <DialogDescription>
            Add, edit, or remove users and manage their roles and permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Existing Users</h3>
            <ScrollArea className="h-[60vh] p-2 border rounded-md">
              <div className="space-y-2">
                {state.users.sort((a,b) => a.username.localeCompare(b.username)).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-md p-2 bg-muted/50"
                  >
                    <div>
                      <span className="font-medium">{user.username}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({user.role})
                      </span>
                    </div>
                    {canManageUser(user) && (
                      <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleSetEditMode(user)}
                          >
                            <Pencil className="h-4 w-4" />
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
                ? `Edit User: ${userToEdit?.username}`
                : 'Add New User'}
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
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input
                              type="password"
                              placeholder={
                                mode === 'edit'
                                  ? 'Leave blank to keep current password'
                                  : ''
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {mode === 'edit'
                              ? 'Leave blank to keep the existing password.'
                              : ''}
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
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="User">User</SelectItem>
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
                        ([groupName, permissions]) => (
                          <div
                            key={groupName}
                            className="space-y-4 p-4 border rounded-md"
                          >
                            <h3 className="font-semibold text-foreground">
                              {groupName}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {permissions.map(({ key, name }) => (
                                <FormField
                                  key={key}
                                  control={form.control}
                                  name={`permissions.${key}`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {name}
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
                          Department Access Permissions
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          If no departments are selected, the user will have
                          access to all departments.
                        </p>
                        <FormField
                          control={form.control}
                          name="departmentPermissions"
                          render={({ field }) => (
                            <FormItem>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {state.departments.map((dept) => (
                                  <FormItem
                                    key={dept}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(dept)}
                                        onCheckedChange={(checked) => {
                                          const newValue = checked
                                            ? [...(field.value || []), dept]
                                            : (field.value || []).filter(
                                                (value) => value !== dept
                                              );
                                          field.onChange(newValue);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {dept}
                                    </FormLabel>
                                  </FormItem>
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
                        <p className="mt-2 font-medium">{role}s have all permissions by default.</p>
                      </div>
                    </div>
                  )}
                   <DialogFooter className="pt-4 flex-row justify-end gap-2">
                    {currentUser?.permissions.canManageAdmins && mode === 'edit' && (
                       <Button type="button" variant="ghost" onClick={handleSetAddMode}>
                           Cancel Edit & Add New
                       </Button>
                    )}
                    {(mode === 'add' && currentUser?.permissions.canManageAdmins) && (
                        <Button type="button" variant="ghost" onClick={handleSetAddMode}>
                            Clear Form
                        </Button>
                    )}

                    <Button type="submit">
                      {mode === 'edit' ? 'Save Changes' : 'Add User'}
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


'use client'
import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import { Pencil, Trash2 } from 'lucide-react'
import type { User } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { v4 as uuidv4 } from 'uuid'
import { FormDescription } from '../ui/form'
import { Separator } from '../ui/separator'

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
      if (isNewUser && data.role === 'User') {
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

const PermissionCheckbox = ({ name, label, control }: any) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
        <FormControl>
          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
        </FormControl>
        <FormLabel className="font-normal">{label}</FormLabel>
      </FormItem>
    )}
  />
)

export default function UserManagementModal({
  isOpen,
  onClose,
  userId: initialUserId,
}: UserManagementModalProps) {
  const { state, dispatch } = useAppContext()
  const { toast } = useToast()
  const [mode, setMode] = useState<'add' | 'edit'>('add')
  const [editingUserId, setEditingUserId] = useState<string | undefined>(
    undefined
  )

  const userToEdit = useMemo(
    () => state.users.find((u) => u.id === editingUserId),
    [state.users, editingUserId]
  )

  const defaultFormValues = {
    id: undefined,
    username: '',
    password: '',
    role: 'User' as 'Admin' | 'User',
    permissions: {},
    departmentPermissions: [],
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  })

  useEffect(() => {
    if (initialUserId) {
      const user = state.users.find((u) => u.id === initialUserId)
      if (user) {
        setMode('edit')
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
      setMode('add')
      setEditingUserId(undefined)
      form.reset(defaultFormValues)
    }
  }, [initialUserId, state.users, form])

  const handleSetEditMode = (user: User) => {
    if (state.currentUser?.id === user.id) {
      dispatch({
        type: 'SET_DIALOG',
        payload: {
          isOpen: true,
          title: 'Error',
          message: 'You cannot edit your own account from this panel.',
          isAlert: true,
        },
      })
      return
    }
    setMode('edit')
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
    setMode('add')
    setEditingUserId(undefined)
    form.reset(defaultFormValues)
  }

  const role = form.watch('role')

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const isUpdating = mode === 'edit' && !!values.id

    if (
      !isUpdating &&
      state.users.some(
        (u) => u.username.toLowerCase() === values.username.toLowerCase()
      )
    ) {
      form.setError('username', { message: 'This username is already taken.' })
      return
    }

    let passwordHash = isUpdating ? userToEdit?.passwordHash : undefined
    if (values.password && values.password.length > 0) {
      passwordHash = await hashPassword(values.password)
    }

    if (!passwordHash && !isUpdating) {
      // This case is caught by validation, but as a fallback:
      form.setError('password', { message: 'Password is required for new users.' })
      return
    }

    const newId = isUpdating ? values.id! : `user-${uuidv4()}`
    const userData: User = {
      id: newId,
      firestoreId: isUpdating ? userToEdit!.firestoreId : newId,
      username: values.username,
      role: values.role,
      permissions: values.role === 'Admin' ? {} : values.permissions,
      departmentPermissions:
        values.role === 'Admin' ? [] : values.departmentPermissions,
      passwordHash: passwordHash!,
    }

    if (isUpdating) {
      dispatch({ type: 'UPDATE_USER', payload: userData })
      toast({ title: 'Success', description: 'User updated successfully.' })
    } else {
      dispatch({ type: 'ADD_USER', payload: userData })
      toast({ title: 'Success', description: 'User created successfully.' })
    }

    handleSetAddMode()
  }

  const handleDeleteUser = (user: User) => {
    if (state.currentUser?.id === user.id) {
      dispatch({
        type: 'SET_DIALOG',
        payload: {
          isOpen: true,
          title: 'Error',
          message: 'You cannot delete your own account.',
          isAlert: true,
        },
      })
      return
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

  const permissionGroups = useMemo(() => {
    const groups: { [key: string]: any[] } = {
      'Document Permissions': [],
      'Open Document Link Permissions': [],
    }

    Object.entries(PERMISSIONS_CONFIG).forEach(([key, name]) => {
      if (key.startsWith('canOpenDocumentLink')) {
        groups['Open Document Link Permissions'].push({ key, name })
      } else if (
        key !== 'canViewLog' &&
        key !== 'canExportData' &&
        key !== 'canManageColumns'
      ) {
        // Basic permissions
        groups['Document Permissions'].push({ key, name })
      }
    })
    return groups
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="space-y-2">
                {state.users.map((user) => (
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
                    <div className="flex items-center gap-2">
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
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <ScrollArea className="h-[45vh] -mx-6 px-6">
                <div className="space-y-4">
                  <DialogHeader className="mb-4">
                    <DialogTitle>
                      {mode === 'edit' ? 'Edit User' : 'Add New User'}
                    </DialogTitle>
                  </DialogHeader>

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
                          {mode === 'edit' && (
                            <FormDescription>
                              Leave blank to keep the existing password when
                              editing.
                            </FormDescription>
                          )}
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
                          <Select onValueChange={field.onChange} value={field.value}>
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

                  {role === 'User' && (
                    <div className="space-y-4 pt-4">
                      <div className="p-4 border rounded-md space-y-4">
                        <h3 className="font-semibold text-foreground">
                          Document Permissions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {permissionGroups['Document Permissions'].map(
                            ({ key, name }) => (
                              <PermissionCheckbox
                                key={key}
                                name={`permissions.${key}`}
                                label={name}
                                control={form.control}
                              />
                            )
                          )}
                        </div>
                      </div>

                      <div className="p-4 border rounded-md space-y-4">
                        <h3 className="font-semibold text-foreground">
                          Open Document Link Permissions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {permissionGroups['Open Document Link Permissions'].map(
                            ({ key, name }) => (
                              <PermissionCheckbox
                                key={key}
                                name={`permissions.${key}`}
                                label={name}
                                control={form.control}
                              />
                            )
                          )}
                        </div>
                      </div>

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
                          render={() => (
                            <FormItem>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                                              checked={field.value?.includes(
                                                dept
                                              )}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([
                                                      ...field.value,
                                                      dept,
                                                    ])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== dept
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {dept}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="pt-6 border-t mt-4">
                <Button type="button" variant="ghost" onClick={handleSetAddMode}>
                  {mode === 'edit' ? 'Cancel Edit' : 'Clear Form'}
                </Button>
                <Button type="submit">
                  {mode === 'edit' ? 'Save Changes' : 'Add User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

    
'use client'
import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppContext } from '@/hooks/use-app-context'
import { PERMISSIONS_CONFIG } from '@/lib/initial-data'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Checkbox } from '../ui/checkbox'

const permissionsSchema = z.record(z.boolean()).default({});

const formSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().optional(),
  role: z.enum(['Admin', 'User']),
  permissions: permissionsSchema,
  departmentPermissions: z.array(z.string()).default([]),
}).refine(data => data.role === 'Admin' || (data.password && data.password.length > 0) || !!data.userId, {
  message: "Password is required for new users.",
  path: ["password"],
});

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

export default function UserManagementModal({ isOpen, onClose, userId }: UserManagementModalProps) {
  const { state, dispatch } = useAppContext()
  const userToEdit = state.users.find(u => u.id === userId)
  const isEditing = !!userToEdit

  const form = useForm<z.infer<typeof formSchema> & { userId?: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: userToEdit?.id,
      username: userToEdit?.username || '',
      password: '',
      role: userToEdit?.role || 'User',
      permissions: userToEdit?.permissions || {},
      departmentPermissions: userToEdit?.departmentPermissions || []
    },
  })

  useEffect(() => {
    form.reset({
        userId: userToEdit?.id,
        username: userToEdit?.username || '',
        password: '',
        role: userToEdit?.role || 'User',
        permissions: userToEdit?.permissions || {},
        departmentPermissions: userToEdit?.departmentPermissions || []
    });
  }, [userId, userToEdit, form]);

  const role = form.watch('role');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const passwordHash = values.password ? await hashPassword(values.password) : userToEdit?.passwordHash;
    if (!passwordHash) {
        // This should not happen due to validation, but as a safeguard
        form.setError("password", { message: "Password is required for new users." });
        return;
    }

    if (isEditing) {
      const updatedUsers = state.users.map(u =>
        u.id === userId
          ? { ...u, username: values.username, passwordHash, role: values.role, permissions: values.permissions, departmentPermissions: values.departmentPermissions }
          : u
      )
      dispatch({ type: 'UPDATE_USERS', payload: updatedUsers })
    } else {
      if (state.users.some(u => u.username === values.username)) {
        form.setError('username', { message: 'This username is already taken.' })
        return
      }
      const newUser = {
        id: `user-${Date.now()}`,
        username: values.username,
        passwordHash,
        role: values.role,
        permissions: values.role === 'Admin' ? {} : values.permissions,
        departmentPermissions: values.role === 'Admin' ? [] : values.departmentPermissions
      }
      dispatch({ type: 'UPDATE_USERS', payload: [...state.users, newUser] })
    }
    onClose()
  }

  const permissionGroups = useMemo(() => {
    const groups: { [key: string]: any[] } = {
        'General': [],
        'Document Actions': [],
        'Document Fields': [],
        'Document Links': []
    };

    Object.entries(PERMISSIONS_CONFIG).forEach(([key, name]) => {
        if (key.startsWith('canOpenDocumentLink')) {
            groups['Document Links'].push({ key, name });
        } else if (key.startsWith('canEdit')) {
            groups['Document Fields'].push({ key, name });
        } else if (key.includes('Document') || key.includes('Combine') || key.includes('Split') || key.includes('Delay') || key.includes('Move') || key.includes('Complete') || key.includes('Delete') || key.includes('Release')) {
            groups['Document Actions'].push({ key, name });
        } else {
            groups['General'].push({ key, name });
        }
    });

    return groups;
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl glassmorphic-card">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Editing user: ${userToEdit.username}` : 'Create a new user and set their role and permissions.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
                <div className="space-y-4">
                    <FormField control={form.control} name="username" render={({ field }) => ( <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder={isEditing ? 'Leave blank to keep current password' : ''} {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                     {role === 'User' && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-medium">Permissions</h3>
                            <Accordion type="multiple" className="w-full">
                                {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                                    <AccordionItem value={groupName} key={groupName}>
                                        <AccordionTrigger>{groupName}</AccordionTrigger>
                                        <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {permissions.map(({key, name}) => (
                                                <FormField
                                                    key={key}
                                                    control={form.control}
                                                    name={`permissions.${key}`}
                                                    render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                        <FormLabel className="text-sm font-normal">{name}</FormLabel>
                                                        <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                        </FormControl>
                                                    </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                                <AccordionItem value="department-permissions">
                                    <AccordionTrigger>Department Access</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Select which departments this user can see documents from. If none are selected, user can see all.</p>
                                        <Controller
                                            control={form.control}
                                            name="departmentPermissions"
                                            render={({ field }) => (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {state.departments.map((dept) => (
                                                        <FormItem key={dept} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                checked={field.value?.includes(dept)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValue = checked
                                                                        ? [...(field.value || []), dept]
                                                                        : (field.value || []).filter((value) => value !== dept);
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                                {dept}
                                                            </label>
                                                        </FormItem>
                                                    ))}
                                                </div>
                                            )}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">{isEditing ? 'Save Changes' : 'Create User'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

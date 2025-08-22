
'use client'
import { useEffect, useMemo, useState } from 'react'
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
import { Pencil, Trash2 } from 'lucide-react'
import type { User } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { v4 as uuidv4 } from 'uuid';

const permissionsSchema = z.record(z.boolean()).default({});

const formSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(1, 'Username is required.'),
  password: z.string().optional(),
  role: z.enum(['Admin', 'User']),
  permissions: permissionsSchema,
  departmentPermissions: z.array(z.string()).default([]),
}).refine(data => {
    const isNewUser = !data.id;
    if (isNewUser && data.role === 'User') {
      return data.password && data.password.length > 0;
    }
    return true;
}, {
  message: "Password is required for new users with the 'User' role.",
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

export default function UserManagementModal({ isOpen, onClose, userId: initialUserId }: UserManagementModalProps) {
  const { state, dispatch } = useAppContext()
  const { toast } = useToast()
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);

  const userToEdit = useMemo(() => state.users.find(u => u.id === editingUserId), [state.users, editingUserId]);

  const defaultFormValues = {
    id: undefined,
    username: '',
    password: '',
    role: 'User' as 'Admin' | 'User',
    permissions: {},
    departmentPermissions: []
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  })
  
  useEffect(() => {
    if (initialUserId) {
        const user = state.users.find(u => u.id === initialUserId);
        if (user) {
            setMode('edit');
            setEditingUserId(initialUserId);
            form.reset({
                id: user.id,
                username: user.username,
                password: '',
                role: user.role,
                permissions: user.permissions || {},
                departmentPermissions: user.departmentPermissions || []
            });
        }
    } else {
        setMode('add');
        setEditingUserId(undefined);
        form.reset(defaultFormValues);
    }
  }, [initialUserId, state.users, form]);

  const handleSetEditMode = (user: User) => {
    setMode('edit');
    setEditingUserId(user.id);
    form.reset({
        id: user.id,
        username: user.username,
        password: '',
        role: user.role,
        permissions: user.permissions || {},
        departmentPermissions: user.departmentPermissions || []
    });
  };

  const handleSetAddMode = () => {
    setMode('add');
    setEditingUserId(undefined);
    form.reset(defaultFormValues);
  }

  const role = form.watch('role');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const isUpdating = mode === 'edit' && !!values.id;

    if (!isUpdating && state.users.some(u => u.username.toLowerCase() === values.username.toLowerCase())) {
        form.setError('username', { message: 'This username is already taken.' });
        return;
    }

    let passwordHash = isUpdating ? userToEdit?.passwordHash : undefined;
    if (values.password) {
        passwordHash = await hashPassword(values.password);
    }
    
    if (!passwordHash && !isUpdating) {
        if(values.role === 'User') {
          form.setError("password", { message: "Password is required for new users." });
          return;
        }
        // For admins, if no password, create a default one (or handle as needed)
        passwordHash = await hashPassword(uuidv4()); // Create a random, unusable password
    }

    const userData: User = {
        id: isUpdating ? values.id! : uuidv4(),
        firestoreId: isUpdating ? userToEdit!.firestoreId : uuidv4(),
        username: values.username,
        role: values.role,
        permissions: values.role === 'Admin' ? {} : values.permissions,
        departmentPermissions: values.role === 'Admin' ? [] : values.departmentPermissions,
        passwordHash: passwordHash!
    }

    if (isUpdating) {
        dispatch({ type: 'UPDATE_USER', payload: userData });
        toast({ title: "Success", description: "User updated successfully." });
    } else {
        dispatch({ type: 'ADD_USER', payload: userData });
        toast({ title: "Success", description: "User created successfully." });
    }
    
    handleSetAddMode();
  }

  const handleDeleteUser = (user: User) => {
    if (state.currentUser?.id === user.id) {
        dispatch({ type: 'SET_DIALOG', payload: { isOpen: true, title: 'Error', message: 'You cannot delete your own account.', isAlert: true }})
        return;
    }
    dispatch({
        type: 'SET_DIALOG',
        payload: {
            isOpen: true,
            title: 'Delete User',
            message: `Are you sure you want to delete user '${user.username}'? This action cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: () => {
                dispatch({ type: 'DELETE_USER', payload: {id: user.id} });
                if (editingUserId === user.id) {
                    handleSetAddMode();
                }
                toast({ title: "User Deleted", description: `User ${user.username} has been removed.` });
            }
        }
    })
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
        } else if (key.startsWith('canEdit') && key !== 'canEditDocumentDetails' && key !== 'canEditCurrentNote') {
            groups['Document Fields'].push({ key, name });
        } else if (key.includes('Document') || key.includes('Combine') || key.includes('Split') || key.includes('Delay') || key.includes('Move') || key.includes('Complete') || key.includes('Delete') || key.includes('Release') || key === 'canEditCurrentNote') {
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
          <DialogTitle>User Management</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
             <div className="space-y-2">
                <h3 className="text-lg font-medium">Existing Users</h3>
                <ScrollArea className="h-40 rounded-md border p-2">
                    <div className="space-y-2">
                    {state.users.map(user => (
                        <div key={user.id} className="flex items-center justify-between rounded-md p-2 bg-muted/50">
                            <div>
                                <span className="font-medium">{user.username}</span>
                                <span className="text-sm text-muted-foreground ml-2">({user.role})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetEditMode(user)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteUser(user)}>
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
                <div className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>{mode === 'edit' ? 'Edit User' : 'Add New User'}</DialogTitle>
                        <DialogDescription>
                            {mode === 'edit' ? `Editing user: ${userToEdit?.username}` : 'Create a new user and set their role and permissions.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[40vh] p-4 -mx-4">
                        <div className="space-y-4 px-1">
                            <FormField control={form.control} name="username" render={({ field }) => ( <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder={mode === 'edit' ? 'Leave blank to keep current password' : ''} {...field} /></FormControl><FormMessage /></FormItem> )} />
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
                                                                <label className="text-sm font-normal" htmlFor={`permission-switch-${key}`}>{name}</label>
                                                                <FormControl>
                                                                <Switch
                                                                    id={`permission-switch-${key}`}
                                                                    checked={!!field.value}
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
                </div>
                <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={handleSetAddMode}>{mode === 'edit' ? "Cancel Edit" : "Clear Form"}</Button>
                <Button type="submit">{mode === 'edit' ? 'Save Changes' : 'Create User'}</Button>
                </DialogFooter>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

    
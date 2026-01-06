
'use client';
import type { User } from './types';
import { PERMISSIONS_CONFIG } from './initial-data';

export const hasPermission = (user: User | null, permissionKey: keyof typeof PERMISSIONS_CONFIG): boolean => {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  if (!user.permissions) return false;
  
  return !!user.permissions[permissionKey];
};

export const hasDepartmentPermission = (user: User | null, departmentName: string): boolean => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (!user.departmentPermissions || user.departmentPermissions.length === 0) {
        return true; // Access to all departments if none are specified
    }
    return user.departmentPermissions.includes(departmentName);
}

export const hasLabelPermission = (user: User | null, label: string | null): boolean => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    // If a document has no label, everyone can see it
    if (!label) return true;
    // If the user has no specific label permissions, they can see all labels
    if (!user.labelPermissions || user.labelPermissions.length === 0) {
        return true;
    }
    // Otherwise, check if the user has permission for this specific label
    return user.labelPermissions.includes(label);
}

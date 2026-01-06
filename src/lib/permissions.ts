
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
    
    const userHasSpecificLabelPermissions = user.labelPermissions && user.labelPermissions.length > 0;

    // If user has specific label permissions set...
    if (userHasSpecificLabelPermissions) {
        // They can only see documents that have a label AND that label is in their permission list.
        return label ? user.labelPermissions.includes(label) : false;
    }

    // If user has no specific label permissions, they can see everything.
    return true;
}

'use client';
import type { User } from './types';
import { PERMISSIONS_CONFIG } from './initial-data';

export const hasPermission = (user: User | null, permissionKey: keyof typeof PERMISSIONS_CONFIG): boolean => {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  
  if (permissionKey === 'canEditDocumentDetails') {
    return Object.keys(user.permissions).some(p => p.startsWith('canEdit') && user.permissions[p] === true);
  }

  return user.permissions?.[permissionKey] === true;
};

export const hasDepartmentPermission = (user: User | null, departmentName: string): boolean => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (!user.departmentPermissions || user.departmentPermissions.length === 0) {
        return true; // Access to all departments if none are specified
    }
    return user.departmentPermissions.includes(departmentName);
}

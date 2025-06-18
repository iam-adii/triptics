import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, PagePermission } from '@/types/localAuth';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';

export default function PermissionSettings() {
  const { getPermissions, updatePagePermissions } = useAuth();
  const [permissions, setPermissions] = useState<PagePermission[]>(getPermissions());
  const [hasChanges, setHasChanges] = useState(false);

  // All available roles
  const roles: UserRole[] = ['admin', 'manager', 'finance', 'telly caller', 'marketing', 'backoffice'];

  // Role display names and colors
  const roleDisplayInfo: Record<UserRole, { name: string; color: string }> = {
    'admin': { name: 'Admin', color: 'bg-red-100 text-red-800 border-red-200' },
    'manager': { name: 'Manager', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'finance': { name: 'Finance', color: 'bg-green-100 text-green-800 border-green-200' },
    'telly caller': { name: 'Telly Caller', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'marketing': { name: 'Marketing', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'backoffice': { name: 'Back Office', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  };

  // Handle permission toggle
  const handlePermissionToggle = (pageId: string, role: UserRole) => {
    setPermissions(prevPermissions => {
      const newPermissions = [...prevPermissions];
      const pageIndex = newPermissions.findIndex(p => p.pageId === pageId);
      
      if (pageIndex !== -1) {
        const page = newPermissions[pageIndex];
        const hasRole = page.roles.includes(role);
        
        // Toggle role
        if (hasRole) {
          // Don't allow removing admin access to settings page
          if (pageId === 'settings' && role === 'admin') {
            toast.error("Admin must have access to Settings page");
            return prevPermissions;
          }
          
          // Remove role from page permissions
          newPermissions[pageIndex] = {
            ...page,
            roles: page.roles.filter(r => r !== role),
          };
        } else {
          // Add role to page permissions
          newPermissions[pageIndex] = {
            ...page,
            roles: [...page.roles, role],
          };
        }
        
        setHasChanges(true);
        return newPermissions;
      }
      
      return prevPermissions;
    });
  };

  // Save all permission changes
  const savePermissions = () => {
    try {
      // Update each page's permissions
      permissions.forEach(page => {
        updatePagePermissions(page.pageId, page.roles);
      });
      
      toast.success('Permissions saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to save permissions');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Page Permissions</CardTitle>
          <CardDescription>Configure which roles can access each page</CardDescription>
        </div>
        <Button 
          onClick={savePermissions} 
          disabled={!hasChanges}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Page</TableHead>
                  {roles.map(role => (
                    <TableHead key={role} className="text-center">
                      <Badge className={`${roleDisplayInfo[role].color} font-medium`}>
                        {roleDisplayInfo[role].name}
                      </Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map(page => (
                  <TableRow key={page.pageId}>
                    <TableCell className="font-medium">{page.pageName}</TableCell>
                    {roles.map(role => {
                      const isChecked = page.roles.includes(role);
                      // Special case: admin must have access to settings
                      const isDisabled = page.pageId === 'settings' && role === 'admin';
                      
                      return (
                        <TableCell key={role} className="text-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handlePermissionToggle(page.pageId, role)}
                            disabled={isDisabled}
                            className="mx-auto"
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Note: Changes to permissions will take effect immediately after saving.</p>
          <p>The admin role will always have access to the Settings page.</p>
        </div>
      </CardContent>
    </Card>
  );
} 
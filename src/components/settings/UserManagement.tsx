import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types/localAuth';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal, Pencil, Trash2, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function UserManagement() {
  const { getUsers, addUser, updateUser, deleteUser, currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(getUsers());
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'backoffice' as UserRole,
  });

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'finance', label: 'Finance' },
    { value: 'telly caller', label: 'Telly Caller' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'backoffice', label: 'Back Office' },
  ];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finance':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'telly caller':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'marketing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'backoffice':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'backoffice',
    });
    setShowPassword(false);
  };

  const handleAddUser = () => {
    try {
      const { firstName, lastName, email, password, role } = formData;

      if (!email || !password || !firstName || !lastName) {
        toast.error('All fields are required');
        return;
      }

      // Check if email already exists
      const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        toast.error('A user with this email already exists');
        return;
      }

      addUser({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      toast.success('User added successfully');
      setIsAddUserOpen(false);
      resetForm();
      refreshUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    }
  };

  const handleEditUser = () => {
    try {
      if (!selectedUser) return;

      const { firstName, lastName, email, password, role } = formData;

      if (!email || !firstName || !lastName) {
        toast.error('Name and email are required');
        return;
      }

      // Check if email already exists for other users
      const existingUser = users.find(user => 
        user.email.toLowerCase() === email.toLowerCase() && user.id !== selectedUser.id
      );
      if (existingUser) {
        toast.error('A user with this email already exists');
        return;
      }

      const updatedUser: User = {
        ...selectedUser,
        firstName,
        lastName,
        email,
        role,
      };

      // Only update password if it was changed
      if (password) {
        updatedUser.password = password;
      }

      updateUser(updatedUser);

      toast.success('User updated successfully');
      setIsEditUserOpen(false);
      setSelectedUser(null);
      resetForm();
      refreshUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = () => {
    try {
      if (!selectedUser) return;

      // Prevent deleting your own account
      if (selectedUser.id === currentUser?.id) {
        toast.error('You cannot delete your own account');
        return;
      }

      deleteUser(selectedUser.id);

      toast.success('User deleted successfully');
      setIsDeleteUserOpen(false);
      setSelectedUser(null);
      refreshUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
    });
    setIsEditUserOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage users and their roles</CardDescription>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with role-based access.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@triptics.in"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleRoleChange(value as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={`${getRoleBadgeColor(user.role)} font-medium`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(user)}
                          disabled={user.id === currentUser?.id}
                          className={user.id === currentUser?.id ? 'text-muted-foreground' : 'text-red-600'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">
                  Password <span className="text-xs text-muted-foreground">(Leave blank to keep unchanged)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleRoleChange(value as UserRole)}
                  disabled={selectedUser?.id === currentUser?.id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUser?.id === currentUser?.id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You cannot change your own role.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedUser && (
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeleteUser} variant="destructive">
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 
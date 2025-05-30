import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserWithRole, Role } from "@/types/auth";

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    roleId: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // First get all Supabase auth users
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        throw authError;
      }

      if (!authData?.users) {
        setUsers([]);
        return;
      }

      // Get user settings with role information
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select(`
          user_id,
          role_id,
          roles: role_id (
            id,
            name,
            description
          )
        `);

      if (settingsError) {
        throw settingsError;
      }

      // Merge auth users with role data
      const mergedUsers = authData.users.map((authUser) => {
        const userSettings = settingsData?.find(
          (settings) => settings.user_id === authUser.id
        );
        
        return {
          ...authUser,
          role: userSettings?.roles || null,
        };
      });

      setUsers(mergedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      setRoles(data || []);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles: " + error.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      roleId: value,
    }));
  };

  const createUser = async () => {
    try {
      const { firstName, lastName, email, password, roleId } = formData;

      if (!email || !password) {
        toast.error("Email and password are required");
        return;
      }

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email verification
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // 2. Create user settings with role
      const { error: settingsError } = await supabase.from("user_settings").insert({
        user_id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role_id: roleId,
      });

      if (settingsError) {
        throw settingsError;
      }

      toast.success("User created successfully");
      setAddUserOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        roleId: "",
      });
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user: " + error.message);
    }
  };

  const updateUserRole = async (userId: string, roleId: string) => {
    try {
      // Check if user_settings entry exists
      const { data: existingSettings, error: checkError } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingSettings) {
        // Update existing user_settings
        const { error: updateError } = await supabase
          .from("user_settings")
          .update({ role_id: roleId })
          .eq("user_id", userId);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Get user email
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError || !userData.user) {
          throw userError || new Error("User not found");
        }

        // Create new user_settings entry
        const { error: insertError } = await supabase
          .from("user_settings")
          .insert({
            user_id: userId,
            email: userData.user.email,
            role_id: roleId,
          });

        if (insertError) {
          throw insertError;
        }
      }

      toast.success("User role updated");
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role: " + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>User Management</span>
          <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
            <DialogTrigger asChild>
              <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with role assignment.
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.roleId} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createUser}>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage users and assign roles for access control.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="space-y-4">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No users found. Add your first user to get started.
                </p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {user.user_metadata?.first_name || ""}{" "}
                        {user.user_metadata?.last_name || ""}
                        {!user.user_metadata?.first_name && !user.user_metadata?.last_name && user.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={user.role?.id || ""} 
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Assign Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
} 
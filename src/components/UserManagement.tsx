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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface UserWithAdmin {
  id: string;
  email: string;
  created_at: string;
  isAdmin: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Get all Supabase auth users
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        throw authError;
      }

      if (!authData?.users) {
        setUsers([]);
        return;
      }

      // Map users and mark admin users
      const mappedUsers = authData.users.map((user) => ({
        id: user.id,
        email: user.email || "",
        created_at: user.created_at,
        isAdmin: user.email === "admin@admin.com"
      }));

      setUsers(mappedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createUser = async () => {
    try {
      const { firstName, lastName, email, password } = formData;

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

      // 2. Create user settings
      const { error: settingsError } = await supabase.from("user_settings").insert({
        user_id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
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
      });
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user: " + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Users</span>
          <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
            <Button 
              onClick={() => setAddUserOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Add User
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. Only admin@admin.com will have admin privileges.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
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
          Manage user accounts. Note: Only admin@admin.com has admin privileges.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No users found. Add a user to get started.
                </p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.isAdmin && (
                        <Badge variant="default" className="bg-emerald-500">
                          Admin
                        </Badge>
                      )}
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
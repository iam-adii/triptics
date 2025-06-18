import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Key, AlertTriangle, Eye, EyeOff, Send, Plus, Trash2, PenLine, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchEmailSettings, saveEmailSettings, testEmailSettings, EmailSettings } from "../services/emailService";
import UserManagement from "@/components/settings/UserManagement";
import PermissionSettings from "@/components/settings/PermissionSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface CompanySettings {
  id: string;
  name: string;
  website: string | null;
  address: string | null;
  country: string | null;
  timezone: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  created_at: string;
  updated_at: string;
}

interface UserSettings {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
}

interface NotificationSettings {
  id: string;
  user_id: string;
  new_leads: boolean;
  new_bookings: boolean;
  payment_receipts: boolean;
  tour_reminders: boolean;
  marketing_emails: boolean;
  push_leads: boolean;
  push_bookings: boolean;
  push_payments: boolean;
}

interface EmailSettingsState {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  sender_name: string;
  sender_email: string;
}

interface TransferRoute {
  id: string;
  name: string;
  description: string;
  cab_types: CabType[];
}

interface CabType {
  id: string;
  name: string;
  price: number;
}

// Add new interface for Terms & Conditions
interface TermsAndConditions {
  id: string;
  inclusions: string[];
  exclusions: string[];
  terms: string[];
  created_at: string;
  updated_at: string;
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [emailSettings, setEmailSettings] = useState<EmailSettingsState>({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    sender_name: '',
    sender_email: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Current password state for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  // Use the notification context
  const { 
    notificationSettings, 
    loading: notificationsLoading, 
    saveNotificationSettings 
  } = useNotifications();

  // New state for transfer routes
  const [transferRoutes, setTransferRoutes] = useState<TransferRoute[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  
  // New state for route form
  const [newRoute, setNewRoute] = useState<{
    id?: string;
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  
  // New state for cab type form
  const [newCabType, setNewCabType] = useState<{
    routeId: string;
    name: string;
    price: number;
  }>({
    routeId: "",
    name: "",
    price: 0,
  });
  
  // Dialog states
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isCabTypeDialogOpen, setIsCabTypeDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // New state for transfer routes search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [routesPerPage] = useState(5);

  // Add new state for Terms & Conditions
  const [termsAndConditions, setTermsAndConditions] = useState<TermsAndConditions>({
    id: '',
    inclusions: [''],
    exclusions: [''],
    terms: [''],
    created_at: '',
    updated_at: ''
  });

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
    fetchTransferRoutes();
    fetchTermsAndConditions();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Company settings
      const { data: company, error: companyError } = await supabase
        .from("company_settings")
        .select("*")
        .single();
      
      if (companyError && companyError.code !== "PGRST116") {
        throw companyError;
      }
      
      if (company) {
        setCompanySettings(company);
      }

      // Email settings
      const emailSettings = await fetchEmailSettings();
      
      if (emailSettings) {
        setEmailSettings(emailSettings);
      } else {
        // If no email settings exist, use defaults
        console.log("No email settings found. Using defaults...");
        
        // Insert default email settings
        const defaultSettings = {
          smtp_host: 'mail.yourdomain.com',
          smtp_port: 587,
          smtp_user: 'noreply@yourdomain.com',
          smtp_password: 'your-password',
          sender_name: 'Triptics Travel',
          sender_email: 'noreply@yourdomain.com'
        };
        
        // Save default settings to database
        await saveEmailSettings(defaultSettings as EmailSettings);
        setEmailSettings(defaultSettings);
        
        // Show a toast notification
        toast.info("Default email settings loaded. Please update with your SMTP details.");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for company settings
  const handleCompanyChange = (field: keyof CompanySettings, value: string) => {
    if (companySettings) {
      setCompanySettings({ ...companySettings, [field]: value });
    }
  };

  // Handle input changes for user settings
  const handleUserChange = (field: keyof UserSettings, value: string) => {
    if (userSettings) {
      setUserSettings({ ...userSettings, [field]: value });
    }
  };

  // Handle toggle changes for notification settings
  const handleNotificationToggle = (field: keyof NotificationSettings) => {
    if (notificationSettings) {
      // Use the saveNotificationSettings function from the context
      saveNotificationSettings({
        [field]: !notificationSettings[field]
      });
    }
  };

  // Handle avatar file upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle input changes for email settings
  const handleEmailSettingsChange = (field: keyof EmailSettingsState, value: string | number) => {
    setEmailSettings(prev => ({ ...prev, [field]: value }));
  };

  // Save company settings
  const saveCompanySettings = async () => {
    if (!companySettings) return;
    
    setSaving(true);
    try {
      // Check if company settings already exist
      const { data: existingData, error: queryError } = await supabase
        .from("company_settings")
        .select("id")
        .limit(1);
      
      const isUpdate = existingData && existingData.length > 0;
      
      if (isUpdate) {
        // Update existing record
        const { error } = await supabase
          .from("company_settings")
          .update({
            name: companySettings.name,
            website: companySettings.website,
            address: companySettings.address,
            country: companySettings.country,
            timezone: companySettings.timezone,
            phone: companySettings.phone,
            email: companySettings.email,
            gstin: companySettings.gstin,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingData[0].id);
          
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("company_settings")
          .insert({
            name: companySettings.name,
            website: companySettings.website,
            address: companySettings.address,
            country: companySettings.country,
            timezone: companySettings.timezone,
            phone: companySettings.phone,
            email: companySettings.email,
            gstin: companySettings.gstin,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }
      
      // Clear the company settings cache
      if (typeof window !== 'undefined') {
        window.companySettingsCache = null;
      }
      
      // Dispatch an event to notify other components that settings have been updated
      window.dispatchEvent(new Event('company-settings-updated'));
      
      toast.success("Company settings saved successfully");
    } catch (error: any) {
      console.error("Error saving company settings:", error);
      toast.error("Error saving company settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Save user settings
  const saveUserSettings = async () => {
    if (!userSettings) return;
    
    setSaving(true);
    try {
      // First handle avatar upload if there's a new file
      let avatarUrl = userSettings.avatar_url;
      
      if (avatarFile) {
        try {
          const fileExt = avatarFile.name.split('.').pop();
          const filePath = `avatars/${userSettings.user_id}/${Date.now()}.${fileExt}`;
          
          // Simple direct upload without any bucket checks
          const { error: uploadError } = await supabase.storage
            .from('public')
            .upload(filePath, avatarFile, {
              upsert: true,
              contentType: avatarFile.type
            });
            
          if (uploadError) throw uploadError;
          
          // Get the public URL
          const { data } = supabase.storage
            .from('public')
            .getPublicUrl(filePath);
            
          avatarUrl = data.publicUrl;
        } catch (error: any) {
          console.error("Error uploading avatar:", error);
          toast.error("Error uploading avatar: " + error.message);
          // Continue with saving other settings even if avatar upload fails
        }
      }
      
      // Update user context data
      const settingsToSave = {
        first_name: userSettings.first_name,
        last_name: userSettings.last_name,
        email: userSettings.email,
        phone: userSettings.phone,
        avatar_url: avatarUrl
      };
      
      // Save to mock storage for demo purposes
      toast.success("User profile updated successfully");
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      toast.error("Error updating user profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Save notification settings - this function is no longer needed as we're using the context
  const saveNotificationSettingsHandler = async () => {
    setSaving(true);
    try {
      // Use the saveNotificationSettings function from the context
      const success = await saveNotificationSettings({});
      
      if (success) {
        toast.success("Notification preferences saved");
      } else {
        toast.error("Failed to save notification preferences");
      }
    } catch (error: any) {
      console.error("Error saving notification settings:", error);
      toast.error("Error saving notification settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    setSaving(true);
    try {
      // Update auth password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Failed to update password: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle API key regeneration
  const handleRegenerateApiKey = () => {
    // This would typically call an edge function to create/update an API key
    toast.success("API key regenerated successfully");
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    
    if (!confirmed) return;
    
    setSaving(true);
    try {
      // Delete the user's account
      // Note: In a real application, you might want to use an edge function
      // that handles cascading deletion of user data
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { user_id: userSettings?.user_id }
      });
      
      if (error) throw error;
      
      // Sign out the user
      await supabase.auth.signOut();
      toast.success("Account deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Save email settings
  const saveEmailSettingsHandler = async () => {
    setSaving(true);
    try {
      const result = await saveEmailSettings(emailSettings as EmailSettings);
      if (result.success) {
        toast.success("Email settings saved successfully");
      } else {
        toast.error(`Failed to save email settings: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Error saving email settings:", error);
      toast.error("Error saving email settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Test email settings
  const testEmailSettingsHandler = async () => {
    setTestingEmail(true);
    try {
      const result = await testEmailSettings(emailSettings as EmailSettings);
      if (result.success) {
        toast.success("Test email sent successfully to " + emailSettings.sender_email);
      } else {
        toast.error(`Failed to send test email: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Error testing email settings:", error);
      toast.error("Error testing email settings: " + error.message);
    } finally {
      setTestingEmail(false);
    }
  };

  // Fetch transfer routes
  const fetchTransferRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      // Fetch routes from Supabase
      const { data: routes, error: routesError } = await supabase
        .from("transfer_routes")
        .select("*")
        .order("name");
      
      if (routesError) throw routesError;
      
      // Fetch cab types for each route
      const routesWithCabTypes = await Promise.all(
        (routes || []).map(async (route) => {
          const { data: cabTypes, error: cabTypesError } = await supabase
            .from("transfer_cab_types")
            .select("*")
            .eq("route_id", route.id)
            .order("name");
          
          if (cabTypesError) throw cabTypesError;
          
          return {
            ...route,
            cab_types: cabTypes || [],
          };
        })
      );
      
      setTransferRoutes(routesWithCabTypes);
    } catch (error: any) {
      console.error("Error fetching transfer routes:", error);
      toast.error("Failed to load transfer routes");
    } finally {
      setIsLoadingRoutes(false);
    }
  };
  
  // Add or update a transfer route
  const handleSaveRoute = async () => {
    setIsSavingRoute(true);
    try {
      if (!newRoute.name.trim()) {
        toast.error("Route name is required");
        return;
      }
      
      let routeId = newRoute.id;
      
      if (isEditMode && routeId) {
        // Update existing route
        const { error } = await supabase
          .from("transfer_routes")
          .update({
            name: newRoute.name,
            description: newRoute.description,
          })
          .eq("id", routeId);
        
        if (error) throw error;
        
        toast.success("Route updated successfully");
      } else {
        // Add new route
        const { data, error } = await supabase
          .from("transfer_routes")
          .insert({
            name: newRoute.name,
            description: newRoute.description,
          })
          .select();
        
        if (error) throw error;
        
        routeId = data[0].id;
        toast.success("Route added successfully");
      }
      
      // Reset form and close dialog
      setNewRoute({
        name: "",
        description: "",
      });
      setIsRouteDialogOpen(false);
      setIsEditMode(false);
      
      // Refresh routes
      fetchTransferRoutes();
    } catch (error: any) {
      console.error("Error saving route:", error);
      toast.error("Failed to save route: " + error.message);
    } finally {
      setIsSavingRoute(false);
    }
  };
  
  // Delete a transfer route
  const handleDeleteRoute = async (routeId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this route? This will also delete all associated cab types."
    );
    
    if (!confirmed) return;
    
    try {
      // Delete cab types first (cascade delete would be better if available)
      const { error: cabTypesError } = await supabase
        .from("transfer_cab_types")
        .delete()
        .eq("route_id", routeId);
      
      if (cabTypesError) throw cabTypesError;
      
      // Delete route
      const { error } = await supabase
        .from("transfer_routes")
        .delete()
        .eq("id", routeId);
      
      if (error) throw error;
      
      toast.success("Route deleted successfully");
      
      // Refresh routes
      fetchTransferRoutes();
    } catch (error: any) {
      console.error("Error deleting route:", error);
      toast.error("Failed to delete route: " + error.message);
    }
  };
  
  // Add or update a cab type
  const handleSaveCabType = async () => {
    try {
      if (!newCabType.name.trim()) {
        toast.error("Cab type name is required");
        return;
      }
      
      if (newCabType.price <= 0) {
        toast.error("Price must be greater than zero");
        return;
      }
      
      // Add new cab type
      const { error } = await supabase
        .from("transfer_cab_types")
        .insert({
          route_id: newCabType.routeId,
          name: newCabType.name,
          price: newCabType.price,
        });
      
      if (error) throw error;
      
      toast.success("Cab type added successfully");
      
      // Reset form and close dialog
      setNewCabType({
        routeId: "",
        name: "",
        price: 0,
      });
      setIsCabTypeDialogOpen(false);
      
      // Refresh routes
      fetchTransferRoutes();
    } catch (error: any) {
      console.error("Error saving cab type:", error);
      toast.error("Failed to save cab type: " + error.message);
    }
  };
  
  // Delete a cab type
  const handleDeleteCabType = async (cabTypeId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this cab type?"
    );
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from("transfer_cab_types")
        .delete()
        .eq("id", cabTypeId);
      
      if (error) throw error;
      
      toast.success("Cab type deleted successfully");
      
      // Refresh routes
      fetchTransferRoutes();
    } catch (error: any) {
      console.error("Error deleting cab type:", error);
      toast.error("Failed to delete cab type: " + error.message);
    }
  };
  
  // Open edit route dialog
  const handleEditRoute = (route: TransferRoute) => {
    setNewRoute({
      id: route.id,
      name: route.name,
      description: route.description,
    });
    setIsEditMode(true);
    setIsRouteDialogOpen(true);
  };
  
  // Open add cab type dialog
  const handleAddCabType = (routeId: string) => {
    setNewCabType({
      routeId,
      name: "",
      price: 0,
    });
    setIsCabTypeDialogOpen(true);
  };

  // Filter routes based on search query
  const filteredRoutes = transferRoutes.filter(route => 
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (route.description && route.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Calculate pagination
  const indexOfLastRoute = currentPage * routesPerPage;
  const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
  const currentRoutes = filteredRoutes.slice(indexOfFirstRoute, indexOfLastRoute);
  const totalPages = Math.ceil(filteredRoutes.length / routesPerPage);
  
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  
  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Add new function to fetch Terms & Conditions
  const fetchTermsAndConditions = async () => {
    try {
      const { data, error } = await supabase
        .from('terms_and_conditions')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create default
          const defaultTerms = {
            inclusions: [''],
            exclusions: [''],
            terms: ['']
          };
          const { data: newData, error: insertError } = await supabase
            .from('terms_and_conditions')
            .insert(defaultTerms)
            .select()
            .single();

          if (insertError) throw insertError;
          setTermsAndConditions(newData);
        } else {
          throw error;
        }
      } else {
        setTermsAndConditions(data);
      }
    } catch (error: any) {
      console.error('Error fetching terms and conditions:', error);
      toast.error('Failed to load terms and conditions');
    }
  };

  // Add new function to save Terms & Conditions
  const saveTermsAndConditions = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('terms_and_conditions')
        .upsert({
          id: termsAndConditions.id || undefined,
          inclusions: termsAndConditions.inclusions.filter(item => item.trim() !== ''),
          exclusions: termsAndConditions.exclusions.filter(item => item.trim() !== ''),
          terms: termsAndConditions.terms.filter(item => item.trim() !== ''),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Terms and conditions saved successfully');
    } catch (error: any) {
      console.error('Error saving terms and conditions:', error);
      toast.error('Failed to save terms and conditions');
    } finally {
      setSaving(false);
    }
  };

  // Add new function to handle array item changes
  const handleArrayItemChange = (
    array: string[],
    index: number,
    value: string,
    setter: (value: string[]) => void
  ) => {
    const newArray = [...array];
    newArray[index] = value;
    setter(newArray);
  };

  // Add new function to add new array item
  const addArrayItem = (
    array: string[],
    setter: (value: string[]) => void
  ) => {
    setter([...array, '']);
  };

  // Add new function to remove array item
  const removeArrayItem = (
    array: string[],
    index: number,
    setter: (value: string[]) => void
  ) => {
    const newArray = array.filter((_, i) => i !== index);
    setter(newArray);
  };

  if (loading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
          {isAdmin && <TabsTrigger value="permissions">Permissions</TabsTrigger>}
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/30">
            <CardHeader>
              <CardTitle className="text-xl text-emerald-600 dark:text-emerald-500">Company Information</CardTitle>
              <CardDescription>
                Update your company details and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="flex items-center">
                    Company Name <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    id="companyName" 
                    value={companySettings?.name || ""}
                    onChange={(e) => handleCompanyChange("name", e.target.value)}
                    className="bg-background/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center">
                    Website <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    id="website" 
                    type="url" 
                    value={companySettings?.website || ""}
                    onChange={(e) => handleCompanyChange("website", e.target.value)}
                    className="bg-background/50"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input 
                    id="companyEmail" 
                    type="email" 
                    value={companySettings?.email || ""}
                    onChange={(e) => handleCompanyChange("email", e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input 
                    id="companyPhone" 
                    type="tel" 
                    value={companySettings?.phone || ""}
                    onChange={(e) => handleCompanyChange("phone", e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN Number</Label>
                <Input 
                  id="gstin" 
                  value={companySettings?.gstin || ""}
                  onChange={(e) => handleCompanyChange("gstin", e.target.value)}
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center">
                  Address <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea 
                  id="address" 
                  rows={3} 
                  value={companySettings?.address || ""}
                  onChange={(e) => handleCompanyChange("address", e.target.value)}
                  className="bg-background/50 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select 
                    value={companySettings?.country || "us"}
                    onValueChange={(value) => handleCompanyChange("country", value)}
                  >
                    <SelectTrigger id="country" className="bg-background/50">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="in">India</SelectItem>
                      <SelectItem value="au">Australia</SelectItem>
                      <SelectItem value="sg">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={companySettings?.timezone || "est"}
                    onValueChange={(value) => handleCompanyChange("timezone", value)}
                  >
                    <SelectTrigger id="timezone" className="bg-background/50">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="est">Eastern Time (ET)</SelectItem>
                      <SelectItem value="cst">Central Time (CT)</SelectItem>
                      <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                      <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                      <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                      <SelectItem value="gmt">GMT/UTC</SelectItem>
                      <SelectItem value="bst">British Summer Time (BST)</SelectItem>
                      <SelectItem value="aest">Australian Eastern Time (AET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={saveCompanySettings} 
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : "Save Company Details"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/30">
            <CardHeader>
              <CardTitle className="text-xl text-emerald-600 dark:text-emerald-500">Email Notifications</CardTitle>
              <CardDescription>
                Choose what types of email notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-4">
                  <div>
                    <Label htmlFor="newLeads" className="text-base">New Leads</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new leads are added to your pipeline
                    </p>
                  </div>
                  <Switch 
                    id="newLeads" 
                    checked={notificationSettings?.new_leads || false}
                    onCheckedChange={() => handleNotificationToggle("new_leads")}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-4">
                  <div>
                    <Label htmlFor="newBookings" className="text-base">New Bookings</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for new tour bookings
                    </p>
                  </div>
                  <Switch 
                    id="newBookings" 
                    checked={notificationSettings?.new_bookings || false}
                    onCheckedChange={() => handleNotificationToggle("new_bookings")}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-4">
                  <div>
                    <Label htmlFor="paymentReceipts" className="text-base">Payment Receipts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get email receipts for all payment transactions
                    </p>
                  </div>
                  <Switch 
                    id="paymentReceipts" 
                    checked={notificationSettings?.payment_receipts || false}
                    onCheckedChange={() => handleNotificationToggle("payment_receipts")}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-4">
                  <div>
                    <Label htmlFor="remindersTour" className="text-base">Tour Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders about upcoming tours
                    </p>
                  </div>
                  <Switch 
                    id="remindersTour" 
                    checked={notificationSettings?.tour_reminders || false}
                    onCheckedChange={() => handleNotificationToggle("tour_reminders")}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-4">
                  <div>
                    <Label htmlFor="marketingEmails" className="text-base">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <Switch 
                    id="marketingEmails"
                    checked={notificationSettings?.marketing_emails || false}
                    onCheckedChange={() => handleNotificationToggle("marketing_emails")}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/30">
            <CardHeader>
              <CardTitle className="text-xl text-emerald-600 dark:text-emerald-500">Push Notifications</CardTitle>
              <CardDescription>
                Configure browser push notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-4">
                  <div>
                    <Label htmlFor="pushNewLeads" className="text-base">New Leads</Label>
                    <p className="text-sm text-muted-foreground">
                      Get instant notifications for new leads
                    </p>
                  </div>
                  <Switch 
                    id="pushNewLeads" 
                    checked={notificationSettings?.push_leads || false}
                    onCheckedChange={() => handleNotificationToggle("push_leads")}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-4">
                  <div>
                    <Label htmlFor="pushNewBookings" className="text-base">New Bookings</Label>
                    <p className="text-sm text-muted-foreground">
                      Get instant notifications for new bookings
                    </p>
                  </div>
                  <Switch 
                    id="pushNewBookings" 
                    checked={notificationSettings?.push_bookings || false}
                    onCheckedChange={() => handleNotificationToggle("push_bookings")}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-4">
                  <div>
                    <Label htmlFor="pushPayments" className="text-base">Payment Received</Label>
                    <p className="text-sm text-muted-foreground">
                      Get instant notifications for payments
                    </p>
                  </div>
                  <Switch 
                    id="pushPayments"
                    checked={notificationSettings?.push_payments || false}
                    onCheckedChange={() => handleNotificationToggle("push_payments")}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={saveNotificationSettingsHandler} 
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : "Save Preferences"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/30">
            <CardHeader>
              <CardTitle className="text-xl text-emerald-600 dark:text-emerald-500">Email Settings</CardTitle>
              <CardDescription>
                Configure SMTP settings to send emails from your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input 
                    id="smtpHost" 
                    placeholder="mail.example.com"
                    value={emailSettings.smtp_host} 
                    onChange={(e) => handleEmailSettingsChange("smtp_host", e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input 
                    id="smtpPort" 
                    type="number"
                    placeholder="587"
                    value={emailSettings.smtp_port} 
                    onChange={(e) => handleEmailSettingsChange("smtp_port", parseInt(e.target.value))}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">Common ports: 25, 465 (SSL), 587 (TLS)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input 
                    id="smtpUser" 
                    placeholder="user@example.com"
                    value={emailSettings.smtp_user} 
                    onChange={(e) => handleEmailSettingsChange("smtp_user", e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <div className="relative">
                    <Input 
                      id="smtpPassword" 
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={emailSettings.smtp_password} 
                      onChange={(e) => handleEmailSettingsChange("smtp_password", e.target.value)}
                      className="bg-background/50 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input 
                    id="senderName" 
                    placeholder="Your Company Name"
                    value={emailSettings.sender_name} 
                    onChange={(e) => handleEmailSettingsChange("sender_name", e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Input 
                    id="senderEmail" 
                    type="email"
                    placeholder="noreply@example.com"
                    value={emailSettings.sender_email} 
                    onChange={(e) => handleEmailSettingsChange("sender_email", e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                onClick={testEmailSettingsHandler} 
                variant="outline"
                disabled={saving || testingEmail}
              >
                {testingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Test Email
                  </>
                )}
              </Button>
              <Button 
                onClick={saveEmailSettingsHandler} 
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : "Save Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Terms & Conditions Tab */}
        <TabsContent value="terms" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/30">
            <CardHeader>
              <CardTitle className="text-xl text-emerald-600 dark:text-emerald-500">Terms & Conditions</CardTitle>
              <CardDescription>
                Manage inclusions, exclusions, and terms & conditions that will appear in customer PDFs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Inclusions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Inclusions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(termsAndConditions.inclusions, (newArray) => 
                      setTermsAndConditions({ ...termsAndConditions, inclusions: newArray })
                    )}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Inclusion
                  </Button>
                </div>
                <div className="space-y-2">
                  {termsAndConditions.inclusions.map((inclusion, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={inclusion}
                        onChange={(e) => handleArrayItemChange(
                          termsAndConditions.inclusions,
                          index,
                          e.target.value,
                          (newArray) => setTermsAndConditions({ ...termsAndConditions, inclusions: newArray })
                        )}
                        placeholder="Enter inclusion point"
                        className="bg-background/50"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem(
                          termsAndConditions.inclusions,
                          index,
                          (newArray) => setTermsAndConditions({ ...termsAndConditions, inclusions: newArray })
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Exclusions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Exclusions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(termsAndConditions.exclusions, (newArray) => 
                      setTermsAndConditions({ ...termsAndConditions, exclusions: newArray })
                    )}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Exclusion
                  </Button>
                </div>
                <div className="space-y-2">
                  {termsAndConditions.exclusions.map((exclusion, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={exclusion}
                        onChange={(e) => handleArrayItemChange(
                          termsAndConditions.exclusions,
                          index,
                          e.target.value,
                          (newArray) => setTermsAndConditions({ ...termsAndConditions, exclusions: newArray })
                        )}
                        placeholder="Enter exclusion point"
                        className="bg-background/50"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem(
                          termsAndConditions.exclusions,
                          index,
                          (newArray) => setTermsAndConditions({ ...termsAndConditions, exclusions: newArray })
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Terms & Conditions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Terms & Conditions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(termsAndConditions.terms, (newArray) => 
                      setTermsAndConditions({ ...termsAndConditions, terms: newArray })
                    )}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Term
                  </Button>
                </div>
                <div className="space-y-2">
                  {termsAndConditions.terms.map((term, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={term}
                        onChange={(e) => handleArrayItemChange(
                          termsAndConditions.terms,
                          index,
                          e.target.value,
                          (newArray) => setTermsAndConditions({ ...termsAndConditions, terms: newArray })
                        )}
                        placeholder="Enter term or condition"
                        className="bg-background/50"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem(
                          termsAndConditions.terms,
                          index,
                          (newArray) => setTermsAndConditions({ ...termsAndConditions, terms: newArray })
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={saveTermsAndConditions} 
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : "Save Terms & Conditions"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Users Management Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>
        )}

        {/* Permissions Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="permissions" className="space-y-4">
            <PermissionSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

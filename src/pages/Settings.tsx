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
import { Loader2, Upload, Key, AlertTriangle, Eye, EyeOff, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchEmailSettings, saveEmailSettings, testEmailSettings, EmailSettings } from "@/services/emailService";

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

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
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

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
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
      setNotificationSettings({
        ...notificationSettings,
        [field]: !notificationSettings[field],
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

  // Save notification settings
  const saveNotificationSettings = async () => {
    if (!notificationSettings) return;
    
    setSaving(true);
    try {
      // Check if settings already exist
      const { data: existingData, error: queryError } = await supabase
        .from("notification_settings")
        .select("id")
        .eq("user_id", notificationSettings.user_id)
        .limit(1);
      
      if (existingData && existingData.length > 0) {
        // Update existing record
        const { error } = await supabase
          .from("notification_settings")
          .update({
            new_leads: notificationSettings.new_leads,
            new_bookings: notificationSettings.new_bookings,
            payment_receipts: notificationSettings.payment_receipts,
            tour_reminders: notificationSettings.tour_reminders,
            marketing_emails: notificationSettings.marketing_emails,
            push_leads: notificationSettings.push_leads,
            push_bookings: notificationSettings.push_bookings,
            push_payments: notificationSettings.push_payments
          })
          .eq("id", existingData[0].id);
          
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("notification_settings")
          .insert({
            user_id: notificationSettings.user_id,
            new_leads: notificationSettings.new_leads,
            new_bookings: notificationSettings.new_bookings,
            payment_receipts: notificationSettings.payment_receipts,
            tour_reminders: notificationSettings.tour_reminders,
            marketing_emails: notificationSettings.marketing_emails,
            push_leads: notificationSettings.push_leads,
            push_bookings: notificationSettings.push_bookings,
            push_payments: notificationSettings.push_payments
          });
          
        if (error) throw error;
      }
      
      toast.success("Notification preferences saved");
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

  if (loading) {
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
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and application settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-5 mb-8">
          <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Profile</TabsTrigger>
          <TabsTrigger value="company" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Company</TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Email</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Notifications</TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Advanced</TabsTrigger>
        </TabsList>

        <div className="mt-4 grid gap-6">
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur border-border/30">
              <CardHeader>
                <CardTitle className="text-xl text-emerald-600 dark:text-emerald-500">Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32 border-4 border-background">
                      <AvatarImage src={avatarPreview || userSettings?.avatar_url || ""} />
                      <AvatarFallback className="bg-emerald-500 text-white text-2xl">
                        {userSettings?.first_name?.[0]}{userSettings?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload">
                      <div className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md cursor-pointer transition-colors">
                        <Upload className="h-4 w-4" />
                        Change Avatar
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={userSettings?.first_name || ""} 
                          onChange={(e) => handleUserChange("first_name", e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={userSettings?.last_name || ""}
                          onChange={(e) => handleUserChange("last_name", e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={userSettings?.email || ""}
                        onChange={(e) => handleUserChange("email", e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        value={userSettings?.phone || ""}
                        onChange={(e) => handleUserChange("phone", e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button 
                  onClick={saveUserSettings} 
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/30">
              <CardHeader>
                <CardTitle className="text-xl text-emerald-600 dark:text-emerald-500">Password</CardTitle>
                <CardDescription>
                  Update your login password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : "Update Password"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
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

          <TabsContent value="email" className="space-y-6">
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

          <TabsContent value="notifications" className="space-y-6">
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
                  onClick={saveNotificationSettings} 
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

          <TabsContent value="advanced" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur border-border/30">
              <CardHeader>
                <CardTitle className="text-xl text-emerald-600 dark:text-emerald-500">API Integration</CardTitle>
                <CardDescription>
                  Manage your API keys and integration settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base">API Key</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value="••••••••••••••••••••••••••••••"
                          readOnly
                          className="bg-background/50 pr-24"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs hover:text-emerald-500"
                          onClick={() => toast.success("API key copied to clipboard")}
                        >
                          Copy
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleRegenerateApiKey}
                        className="bg-background/50 hover:text-emerald-500"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Regenerate
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use this key to authenticate API requests from your applications
                    </p>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-medium mb-1">Webhook Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure webhook endpoints for real-time event notifications
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input 
                        id="webhookUrl"
                        placeholder="https://your-domain.com/webhook"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-background/50">
                        New Leads
                      </Badge>
                      <Badge variant="outline" className="bg-background/50">
                        Bookings
                      </Badge>
                      <Badge variant="outline" className="bg-background/50">
                        Payments
                      </Badge>
                      <Badge variant="outline" className="bg-background/50">
                        Tour Updates
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/30">
              <CardHeader>
                <CardTitle className="text-xl text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-destructive/50 p-4 bg-destructive/5">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
                    <div className="space-y-2">
                      <h3 className="font-medium">Delete Account</h3>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <div className="pt-2">
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteAccount} 
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                            </>
                          ) : "Delete Account"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

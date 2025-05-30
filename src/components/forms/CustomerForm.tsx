import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, UserPlus, Send } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface CustomerFormProps {
  customer?: FormValues & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showGreetingDialog, setShowGreetingDialog] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState<FormValues | null>(null);
  const [greetingMessage, setGreetingMessage] = useState("");
  const [sendingGreeting, setSendingGreeting] = useState(false);
  
  // Get company settings from context
  const { companySettings, loading: loadingCompanySettings } = useCompanySettings();

  const debouncedSearchTerm = useDebounce(searchQuery, 300);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
    },
  });

  // Keep searchQuery in sync with form name value
  useEffect(() => {
    setSearchQuery(form.watch("name"));
  }, [form.watch("name")]);

  // Setup default greeting message when dialog opens with company settings
  useEffect(() => {
    if (showGreetingDialog && newCustomerData && companySettings) {
      const defaultGreeting = `Hello ${newCustomerData.name},

Welcome to ${companySettings.name}! We're thrilled to have you join our family of adventure seekers.

At ${companySettings.name}, we specialize in creating unforgettable travel experiences across India. Our team is ready to help you plan your next dream vacation.

Some key highlights about us:
• Established in 2018
• Over 200+ curated travel experiences
• 24/7 customer support during your trip
• Personalized itineraries to match your preferences

Feel free to reach out if you have any questions or if you're ready to start planning your next adventure!

Best regards,
The ${companySettings.name} Team
📞 ${companySettings.phone || "+91 9876543210"}
🌐 ${companySettings.website || "www.triptics.com"}
${companySettings.address ? `🏢 ${companySettings.address}` : ""}`;

      setGreetingMessage(defaultGreeting);
    }
  }, [showGreetingDialog, newCustomerData, companySettings]);

  // Fetch leads when search query changes
  useEffect(() => {
    async function fetchLeads() {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        setLeads([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data } = await supabase
          .from("leads")
          .select("id, name, email, phone, notes")
          .or(`name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`)
          .limit(5);
        setLeads(Array.isArray(data) ? data : []);
      } catch (error) {
        setLeads([]);
      } finally {
        setIsSearching(false);
      }
    }
    fetchLeads();
  }, [debouncedSearchTerm]);

  // Handle selecting a lead from suggestions
  const handleSelectLead = (lead: Lead) => {
    form.setValue("name", lead.name);
    form.setValue("email", lead.email);
    form.setValue("phone", lead.phone || "");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || leads.length === 0) return;
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev + 1) % leads.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => (prev - 1 + leads.length) % leads.length);
      e.preventDefault();
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handleSelectLead(leads[highlightedIndex]);
      e.preventDefault();
    }
  };

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Ensure it has country code (default to India +91 if not present)
    if (!cleaned.startsWith('91') && !cleaned.startsWith('+91')) {
      cleaned = '91' + cleaned;
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1); // Remove the + sign
    }
    
    return cleaned;
  };

  // Handle sending WhatsApp greeting
  const handleSendGreeting = () => {
    if (!newCustomerData || !newCustomerData.phone) {
      toast.error("Customer phone number is required to send WhatsApp message");
      return;
    }

    try {
      // Format phone number
      const phoneNumber = formatPhoneForWhatsApp(newCustomerData.phone);
      
      // Encode the message for URL
      const encodedMessage = encodeURIComponent(greetingMessage);
      
      // Generate WhatsApp web URL
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      // Open in a new tab
      window.open(whatsappURL, '_blank');
      
      toast.success("WhatsApp opened with your greeting message");
      setShowGreetingDialog(false);
      
      // Proceed with form success
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to open WhatsApp. Please try again.");
    }
  };

  // Skip sending greeting and proceed
  const handleSkipGreeting = () => {
    setShowGreetingDialog(false);
    if (onSuccess) onSuccess();
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      if (customer?.id) {
        const { error } = await supabase
          .from("customers")
          .update({
            name: values.name,
            email: values.email,
            phone: values.phone,
            address: values.address,
            updated_at: new Date().toISOString(),
          })
          .eq("id", customer.id);
        if (error) throw error;
        toast.success("Customer updated successfully");
        if (onSuccess) onSuccess();
      } else {
        const { error } = await supabase.from("customers").insert({
          name: values.name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          total_bookings: 0,
          total_spent: 0.00,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        toast.success("Customer created successfully");
        
        // Show greeting dialog for new customers if they have a phone number
        if (values.phone) {
          setNewCustomerData(values);
          setShowGreetingDialog(true);
        } else {
          if (onSuccess) onSuccess();
        }
      }
      form.reset();
    } catch (error) {
      toast.error("Failed to save customer. Please try again.");
      setIsSubmitting(false);
    } finally {
      if (customer?.id || !values.phone) {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex flex-col relative">
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Search for a lead or enter a new name"
                    autoComplete="off"
                    onChange={e => {
                      field.onChange(e);
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                    onKeyDown={handleKeyDown}
                  />
                </FormControl>
                {showSuggestions && searchQuery.length >= 2 && (
                  <div className="absolute z-10 left-0 top-full w-full rounded shadow max-h-60 overflow-auto border border-border bg-popover text-popover-foreground dark:bg-popover dark:text-popover-foreground">
                    {isSearching ? (
                      <div className="p-3 text-center text-muted-foreground text-sm">Searching...</div>
                    ) : leads.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground text-sm">No leads found. Enter a new customer name.</div>
                    ) : (
                      leads.map((lead, idx) => (
                        <div
                          key={lead.id}
                          className={`px-4 py-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900 ${highlightedIndex === idx ? 'bg-emerald-100 dark:bg-emerald-800' : ''}`}
                          onMouseDown={() => handleSelectLead(lead)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-xs text-muted-foreground">{lead.email}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Email address" 
                    {...field} 
                    required 
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Phone number" 
                    {...field} 
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Full address"
                    className="resize-none bg-background min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="min-w-[100px]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit"
              className="min-w-[100px] bg-emerald-500 hover:bg-emerald-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {customer?.id ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {!customer?.id && <UserPlus className="mr-2 h-4 w-4" />}
                  {customer?.id ? "Update Customer" : "Create Customer"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* WhatsApp Greeting Dialog */}
      <Dialog open={showGreetingDialog} onOpenChange={setShowGreetingDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Welcome Message</DialogTitle>
            <DialogDescription>
              Send a greeting message to {newCustomerData?.name} via WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="rounded-lg border p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                  <span className="text-lg font-bold">
                    {newCustomerData?.name?.charAt(0) || "C"}
                  </span>
                </div>
                <div>
                  <p className="font-medium">Send to: {newCustomerData?.name}</p>
                  <p className="text-sm text-muted-foreground">{newCustomerData?.phone}</p>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="greeting-message" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Message</label>
              <Textarea
                id="greeting-message"
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                className="min-h-[200px] font-mono text-sm mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Customize the welcome message to be sent via WhatsApp
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleSkipGreeting}
              disabled={sendingGreeting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSendGreeting}
              disabled={sendingGreeting || !newCustomerData?.phone}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Send className="mr-2 h-4 w-4" />
              Open WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

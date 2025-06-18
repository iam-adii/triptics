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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CalendarIcon, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  destination: z.string().optional(),
  client_id: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  adults?: number;
  children?: number;
}

export interface ItineraryFormProps {
  itinerary?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  onOpenBuilder?: (itineraryId: string) => void;
}

export function ItineraryForm({ itinerary, onSuccess, onCancel, onOpenBuilder }: ItineraryFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingAndBuilding, setSavingAndBuilding] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers for the dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, name, email, phone, adults, children")
          .order("name");
        
        if (error) throw error;
        setCustomers(data || []);
        
        // If editing an existing itinerary, set the selected customer
        if (itinerary?.client_id) {
          const customer = data?.find(c => c.id === itinerary.client_id);
          if (customer) {
            setSelectedCustomer(customer);
          }
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
      }
    };

    fetchCustomers();
  }, [itinerary?.client_id]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: itinerary?.name || "",
      destination: itinerary?.destination || "",
      client_id: itinerary?.client_id || undefined,
      start_date: itinerary?.start_date ? new Date(itinerary.start_date) : undefined,
      end_date: itinerary?.end_date ? new Date(itinerary.end_date) : undefined,
      notes: itinerary?.notes || "",
    },
  });

  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    form.setValue("client_id", customerId);
  };

  async function onSubmit(values: FormValues, openBuilder = false) {
    if (openBuilder) {
      setSavingAndBuilding(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Calculate duration if both dates are provided
      const duration = values.start_date && values.end_date 
        ? Math.ceil((values.end_date.getTime() - values.start_date.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : undefined;
      
      // Get selected customer's full data
      let customerData = selectedCustomer;
      
      let itineraryId = itinerary?.id;
      
      if (itineraryId) {
        // Update existing itinerary
        const { error } = await supabase
          .from("itineraries")
          .update({
            name: values.name,
            destination: values.destination,
            client_id: values.client_id,
            customer_email: customerData?.email || null,
            customer_phone: customerData?.phone || null,
            adults: customerData?.adults || 0,
            children: customerData?.children || 0,
            start_date: values.start_date?.toISOString().split('T')[0],
            end_date: values.end_date?.toISOString().split('T')[0],
            duration: duration,
            notes: values.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itineraryId);

        if (error) {
          console.error("Error updating itinerary:", error);
          throw error;
        }
        toast.success("Itinerary updated successfully");
      } else {
        // Create new itinerary
        const { data, error } = await supabase
          .from("itineraries")
          .insert({
            name: values.name,
            destination: values.destination,
            client_id: values.client_id,
            customer_email: customerData?.email || null,
            customer_phone: customerData?.phone || null,
            adults: customerData?.adults || 0,
            children: customerData?.children || 0,
            start_date: values.start_date?.toISOString().split('T')[0],
            end_date: values.end_date?.toISOString().split('T')[0],
            duration: duration,
            status: "Draft",
            notes: values.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (error) {
          console.error("Error creating itinerary:", error);
          throw error;
        }
        itineraryId = data[0].id;
        toast.success("Itinerary created successfully");
      }

      form.reset();
      
      if (openBuilder && onOpenBuilder && itineraryId) {
        onOpenBuilder(itineraryId);
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error submitting itinerary:", error);
      toast.error(error.message || "Failed to save itinerary. Please try again.");
    } finally {
      setLoading(false);
      setSavingAndBuilding(false);
    }
  }

  // Watch the start and end dates to calculate duration
  const startDate = form.watch("start_date");
  const endDate = form.watch("end_date");
  
  // Calculate and display the duration if both dates are present
  const calculatedDuration = startDate && endDate 
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values, false))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Itinerary Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. Golden Triangle Tour" 
                  {...field} 
                  required 
                  className="h-11 sm:h-10" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. Delhi, Agra, Jaipur" 
                  {...field} 
                  className="h-11 sm:h-10" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select
                onValueChange={handleCustomerChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-11 sm:h-10">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedCustomer && (
          <div className="border p-4 rounded-md bg-gray-50 dark:bg-gray-900 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <h3 className="font-medium">Travel Group Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adults</p>
                <p className="text-sm">{selectedCustomer.adults || 0} (aged 8 and above)</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Children</p>
                <p className="text-sm">{selectedCustomer.children || 0} (under age 8)</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">
                  Total travelers: {(selectedCustomer.adults || 0) + (selectedCustomer.children || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal h-11 sm:h-10",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal h-11 sm:h-10",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => 
                        startDate ? date < startDate : false
                      }
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {calculatedDuration && (
          <div className="text-sm text-muted-foreground">
            Duration: {calculatedDuration} day{calculatedDuration > 1 ? 's' : ''}
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional information"
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 h-11 sm:h-10"
            >
              Cancel
            </Button>
          )}
          
          {onOpenBuilder && (
            <Button 
              type="button" 
              variant="secondary"
              disabled={loading || savingAndBuilding} 
              onClick={() => form.handleSubmit((values) => onSubmit(values, true))()}
              className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 h-11 sm:h-10"
            >
              {savingAndBuilding ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-emerald-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                "Save & Build Itinerary"
              )}
            </Button>
          )}
          
          <Button 
            type="submit" 
            disabled={loading || savingAndBuilding} 
            className="bg-emerald-500 hover:bg-emerald-600 h-11 sm:h-10"
          >
            {loading ? 
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
              : 
              (itinerary?.id ? "Update Itinerary" : "Create Itinerary")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}

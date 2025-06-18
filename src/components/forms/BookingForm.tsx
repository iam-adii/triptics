import React, { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  itinerary_id: z.string().min(1, "Itinerary is required"),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date({ required_error: "End date is required" }),
  status: z.string().default("Pending"),
  total_amount: z.coerce.number().min(0, "Amount must be a positive number"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface BookingFormProps {
  booking?: Partial<FormValues> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BookingForm({ booking, onSuccess, onCancel }: BookingFormProps) {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [itineraries, setItineraries] = useState<{ id: string; name: string; destination: string; budget: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: booking?.customer_id || "",
      itinerary_id: booking?.itinerary_id || "",
      start_date: booking?.start_date ? new Date(booking.start_date) : new Date(),
      end_date: booking?.end_date ? new Date(booking.end_date) : new Date(),
      status: booking?.status || "Pending",
      total_amount: booking?.total_amount || 0,
      notes: booking?.notes || "",
    },
  });

  // Fetch customers and itineraries on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("id, name")
          .order("name");

        if (customersError) throw customersError;
        if (customersData) setCustomers(customersData);

        // Fetch itineraries instead of tours
        const { data: itinerariesData, error: itinerariesError } = await supabase
          .from("itineraries")
          .select("id, name, destination, budget")
          .order("name");

        if (itinerariesError) throw itinerariesError;
        if (itinerariesData) setItineraries(itinerariesData);
        
        // If we have a booking with an itinerary_id, set the total_amount based on the itinerary budget
        if (booking?.itinerary_id) {
          const selectedItinerary = itinerariesData?.find(itinerary => itinerary.id === booking.itinerary_id);
          if (selectedItinerary && !booking.total_amount && selectedItinerary.budget) {
            form.setValue("total_amount", selectedItinerary.budget);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load necessary data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [booking?.itinerary_id, form]);

  // Set itinerary budget as price when itinerary is selected
  const handleItineraryChange = (itineraryId: string) => {
    form.setValue("itinerary_id", itineraryId);
    const selectedItinerary = itineraries.find(itinerary => itinerary.id === itineraryId);
    if (selectedItinerary && selectedItinerary.budget) {
      form.setValue("total_amount", selectedItinerary.budget);
    }
  };

  async function onSubmit(values: FormValues) {
    try {
      console.log("Form values:", values);
      
      const bookingData = {
        customer_id: values.customer_id,
        itinerary_id: values.itinerary_id,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: format(values.end_date, 'yyyy-MM-dd'),
        status: values.status,
        total_amount: values.total_amount,
        notes: values.notes || ""
      };

      console.log("Booking data to submit:", bookingData);
      
      if (booking?.id) {
        // Update existing booking
        const { data, error } = await supabase
          .from("bookings")
          .update({
            ...bookingData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking.id)
          .select();

        if (error) {
          console.error("Error updating booking:", error);
          throw error;
        }
        
        console.log("Updated booking:", data);
        toast.success("Booking updated successfully");
      } else {
        // Create new booking
        const { data, error } = await supabase
          .from("bookings")
          .insert([{  // Note: Insert expects an array of objects
            ...bookingData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select();

        if (error) {
          console.error("Error creating booking:", error);
          throw error;
        }
        
        console.log("Created booking:", data);
        toast.success("Booking created successfully");
      }

      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error submitting booking:", error);
      toast.error(`Failed to save booking: ${error.message || "Please try again."}`);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        <span className="ml-2">Loading form data...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer *</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.length === 0 ? (
                    <SelectItem value="no-customers" disabled>No customers found</SelectItem>
                  ) : (
                    customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="itinerary_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Itinerary *</FormLabel>
              <Select 
                onValueChange={handleItineraryChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select itinerary" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {itineraries.length === 0 ? (
                    <SelectItem value="no-itineraries" disabled>No itineraries found</SelectItem>
                  ) : (
                    itineraries.map(itinerary => (
                      <SelectItem key={itinerary.id} value={itinerary.id}>
                        {itinerary.name} - {itinerary.destination} {itinerary.budget ? `- ₹${itinerary.budget.toLocaleString()}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : (
                          <span>Pick a date</span>
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
                <FormLabel>End Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : (
                          <span>Pick a date</span>
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
                      disabled={(date) => date < form.getValues().start_date}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="total_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Amount (₹) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  {...field}
                  value={field.value}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional information"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
            {booking?.id ? "Update Booking" : "Create Booking"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

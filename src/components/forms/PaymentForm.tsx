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
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  booking_id: z.string().min(1, "Booking is required"),
  payment_id: z.string().min(1, "Payment ID is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  method: z.string().min(1, "Payment method is required"),
  date: z.date({ required_error: "Payment date is required" }),
  status: z.string().default("Pending"),
  payment_type: z.string().default("Full"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface PaymentFormProps {
  payment?: Partial<FormValues> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ payment, onSuccess, onCancel }: PaymentFormProps) {
  const [bookings, setBookings] = useState<{ 
    id: string; 
    display: string; 
    amount: number;
    paidAmount: number; 
    remainingAmount: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<{
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  }>({ totalAmount: 0, paidAmount: 0, remainingAmount: 0 });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      booking_id: payment?.booking_id || "",
      payment_id: payment?.payment_id || `PAY-${Date.now().toString().slice(-6)}`,
      amount: payment?.amount || 0,
      method: payment?.method || "Credit Card",
      date: payment?.date ? new Date(payment.date) : new Date(),
      status: payment?.status || "Pending",
      payment_type: payment?.payment_type || "Partial",
      notes: payment?.notes || "",
    },
  });

  // Calculate total paid and remaining amount for a booking
  const calculateBookingPayments = async (bookingId: string) => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("total_amount")
        .eq("id", bookingId)
        .single();
      
      if (bookingError) throw bookingError;
      
      const totalAmount = bookingData.total_amount;
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("amount, status")
        .eq("booking_id", bookingId);
        
      if (paymentsError) throw paymentsError;
      
      const paidAmount = paymentsData
        .filter(payment => payment.status === "Completed")
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      const remainingAmount = totalAmount - paidAmount;
      
      return {
        totalAmount,
        paidAmount,
        remainingAmount: remainingAmount > 0 ? remainingAmount : 0
      };
    } catch (error) {
      console.error("Error calculating booking payments:", error);
      return { totalAmount: 0, paidAmount: 0, remainingAmount: 0 };
    }
  };

  // Fetch bookings on component mount
  useEffect(() => {
    async function fetchBookings() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            total_amount,
            customers (name),
            tours (name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          // Calculate paid and remaining amounts for each booking
          const bookingsWithPayments = await Promise.all(data.map(async (booking) => {
            const { totalAmount, paidAmount, remainingAmount } = await calculateBookingPayments(booking.id);
            return {
              id: booking.id,
              display: `${booking.customers?.name || 'Unknown'} - ${booking.tours?.name || 'Unknown Tour'}`,
              amount: booking.total_amount,
              paidAmount,
              remainingAmount
            };
          }));
          
          setBookings(bookingsWithPayments);
          
          // If editing an existing payment, set the selectedBookingId
          if (payment?.booking_id) {
            setSelectedBookingId(payment.booking_id);
            const bookingDetails = await calculateBookingPayments(payment.booking_id);
            setSelectedBookingDetails(bookingDetails);
          }
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load bookings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
  }, [payment?.booking_id]);

  // Handle booking selection
  const handleBookingChange = async (bookingId: string) => {
    form.setValue("booking_id", bookingId);
    setSelectedBookingId(bookingId);
    
    // Find the selected booking in our local state
    const selectedBooking = bookings.find(booking => booking.id === bookingId);
    if (selectedBooking) {
      // For new payments, suggest the remaining amount if it's a partial payment
      // or the full amount if no payments have been made yet
      if (!payment?.id) {
        if (selectedBooking.remainingAmount > 0) {
          form.setValue("amount", selectedBooking.remainingAmount);
          form.setValue("payment_type", "Partial");
        } else {
          form.setValue("amount", selectedBooking.amount);
          form.setValue("payment_type", "Full");
        }
      }
      
      // Update booking details display
      setSelectedBookingDetails({
        totalAmount: selectedBooking.amount,
        paidAmount: selectedBooking.paidAmount,
        remainingAmount: selectedBooking.remainingAmount
      });
    }
  };

  // Handle payment type selection
  const handlePaymentTypeChange = (type: string) => {
    form.setValue("payment_type", type);
    
    // Adjust amount based on payment type
    if (type === "Full" && selectedBookingId) {
      const booking = bookings.find(b => b.id === selectedBookingId);
      if (booking) {
        form.setValue("amount", booking.remainingAmount);
      }
    }
  };

  async function onSubmit(values: FormValues) {
    try {
      // Validate that a booking is selected
      if (!values.booking_id || values.booking_id === "no-bookings") {
        toast.error("Please select a valid booking");
        return;
      }
      
      const paymentData = {
        booking_id: values.booking_id,
        payment_id: values.payment_id,
        amount: values.amount,
        method: values.method,
        date: format(values.date, "yyyy-MM-dd'T'HH:mm:ssX"),
        status: values.status,
        payment_type: values.payment_type,
        notes: values.notes || "",
      };

      console.log("Submitting payment data:", paymentData);

      if (payment?.id) {
        // Update existing payment
        const { error } = await supabase
          .from("payments")
          .update({
            ...paymentData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
        toast.success("Payment updated successfully");
      } else {
        // Create new payment
        const { data, error } = await supabase.from("payments").insert({
          ...paymentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).select();

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
        
        console.log("Payment created successfully:", data);
        toast.success("Payment recorded successfully");
      }

      form.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting payment:", error);
      let errorMessage = "Failed to save payment. Please try again.";
      
      // If it's a specific known error type, provide more details
      if (error instanceof Error) {
        errorMessage = `Payment error: ${error.message}`;
      }
      
      toast.error(errorMessage);
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
          name="booking_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Booking *</FormLabel>
              <Select 
                onValueChange={handleBookingChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bookings.length === 0 ? (
                    <SelectItem value="no-bookings" disabled>No bookings found</SelectItem>
                  ) : (
                    bookings.map(booking => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.display} - ₹{booking.amount.toLocaleString()}
                        {booking.remainingAmount > 0 && booking.paidAmount > 0 && 
                          ` (₹${booking.remainingAmount.toLocaleString()} remaining)`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedBookingId && selectedBookingDetails.remainingAmount > 0 && (
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Payment Summary:</span> 
              <span className="ml-2">
                Total: ₹{selectedBookingDetails.totalAmount.toLocaleString()} | 
                Paid: ₹{selectedBookingDetails.paidAmount.toLocaleString()} | 
                Remaining: ₹{selectedBookingDetails.remainingAmount.toLocaleString()}
              </span>
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="payment_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment ID *</FormLabel>
              <FormControl>
                <Input placeholder="Enter payment reference ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Type *</FormLabel>
                <Select
                  onValueChange={(value) => handlePaymentTypeChange(value)}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Partial">Partial Payment</SelectItem>
                    <SelectItem value="Full">Full Payment</SelectItem>
                    <SelectItem value="Advance">Advance Payment</SelectItem>
                    <SelectItem value="Refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₹) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Payment Date *</FormLabel>
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
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
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
            {payment?.id ? "Update Payment" : "Record Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

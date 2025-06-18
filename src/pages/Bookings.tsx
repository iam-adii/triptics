import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Loader2, Eye, Calendar as CalendarIcon, CreditCard, File, Mail, Edit } from "lucide-react";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { FormDialog } from "@/components/ui/form-dialog";
import { BookingForm } from "@/components/forms/BookingForm";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useDebounce } from "@/hooks/useDebounce";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import ReceiptPDF, { shareReceiptViaEmail } from "@/components/ReceiptPDF";
import { PDFViewer } from '@react-pdf/renderer';
import PaymentReceipt from '@/components/PaymentReceipt';
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { shareItineraryViaEmail } from "@/components/ItineraryPDF";
import BookingItinerary from "@/components/BookingItinerary";
import ItineraryPDF from "@/components/ItineraryPDF";

// Define booking type to avoid deep type instantiation issues
interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Itinerary {
  id: string;
  name: string;
  destination: string;
}

// Use simpler type structure to avoid deep instantiation
interface Booking {
  id: string;
  booking_number?: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
  customers: { id: string; name: string; email: string } | null;
  itineraries: { id: string; name: string; destination: string } | null;
  notes?: string;
  payments?: {
    id: string;
    amount: number;
    status: string;
    payment_date: string;
    payment_method: string;
  }[];
  created_at: string;
}

// Define form booking type to match BookingForm expectations
interface FormBooking {
  id?: string;
  customer_id?: string;
  itinerary_id?: string;
  start_date?: Date;
  end_date?: Date;
  status?: string;
  total_amount?: number;
  notes?: string;
}

// Add a new interface for Payment
interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string;
  payment_method: string;
  booking_id?: string;
  payment_id?: string;
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<FormBooking | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const itemsPerPage = 10;
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [bookingDateRange, setBookingDateRange] = useState<DateRange | undefined>();
  const [isBookingDatePopoverOpen, setIsBookingDatePopoverOpen] = useState(false);
  const [isPaymentDetailDialogOpen, setIsPaymentDetailDialogOpen] = useState(false);
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<Payment | null>(null);
  const [paymentStatusUpdating, setPaymentStatusUpdating] = useState(false);
  const [isReceiptViewerOpen, setIsReceiptViewerOpen] = useState(false);
  const [isItineraryViewerOpen, setIsItineraryViewerOpen] = useState(false);
  const [selectedBookingForItinerary, setSelectedBookingForItinerary] = useState<Booking | null>(null);
  const { companySettings } = useCompanySettings();
  
  // Use debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchQuery, 500);

  // Fetch bookings on component mount or when filters change
  useEffect(() => {
    fetchBookings();
  }, [statusFilter, paymentFilter, debouncedSearchTerm, currentPage, dateRange, bookingDateRange]);

  async function fetchBookings() {
    setLoading(true);
    try {
      // Fetch all bookings and related data, including created_at
      const query = supabase
        .from("bookings")
        .select(`
          id,
          start_date,
          end_date,
          status,
          total_amount,
          created_at,
          customers (id, name, email),
          itineraries (id, name, destination),
          payments (
            id,
            amount,
            status,
            payment_method,
            payment_date
          )
        `);
      
      // Apply filters
      if (statusFilter !== "all") {
        query.eq("status", statusFilter);
      }
      
      // For payment filter
      if (paymentFilter !== "all") {
        // We'll handle payment filtering after fetching the data
        // since we need to calculate payment status
      }
      
      // Count total records for pagination
      const { count, error: countError } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true });
      
      if (countError) throw countError;
      
      // Calculate total pages
      if (count !== null) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
      
      // Remove pagination from the initial query
      const { data, error } = await query
        .order("created_at", { ascending: false });
      if (error) throw error;
      let typedData: Booking[] = [];
      if (data) {
        typedData = data as unknown as Booking[];
      }
      // Apply search filter to the full list
      let filtered = typedData;
      if (debouncedSearchTerm) {
        const search = debouncedSearchTerm.toLowerCase();
        filtered = filtered.filter(b =>
          (b.customers?.name && b.customers.name.toLowerCase().includes(search)) ||
          (b.itineraries?.name && b.itineraries.name.toLowerCase().includes(search))
        );
      }

      // Booking date filter
      if (bookingDateRange?.from && bookingDateRange?.to) {
        const fromDate = new Date(bookingDateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(bookingDateRange.to);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate >= fromDate && bookingDate <= toDate;
        });
      } else if (bookingDateRange?.from) {
        const fromDate = new Date(bookingDateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate >= fromDate;
        });
      }

      // Calculate payment status and filter based on payment status
      const processedData = filtered.map(booking => {
        const paymentStatus = calculatePaymentStatus(booking);
        return {
          ...booking,
          paymentStatus
        };
      });

      // Apply payment filter if needed
      let filteredData = processedData;
      if (paymentFilter !== "all") {
        filteredData = processedData.filter(booking => 
          booking.paymentStatus.status.toLowerCase() === paymentFilter.toLowerCase()
        );
      }

      // Apply date range filter
      if (dateRange?.from && dateRange?.to) {
        filteredData = filteredData.filter(b => {
          const bookingStart = new Date(b.start_date);
          const bookingEnd = new Date(b.end_date);
          return bookingEnd >= dateRange.from && bookingStart <= dateRange.to;
        });
      }

      // Pagination
      const paginated = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
      setBookings(paginated);
      setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  const handleAddBooking = () => {
    setSelectedBooking(null);
    setIsFormOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    // Convert string dates to Date objects for the form
    const startDate = booking.start_date ? new Date(booking.start_date) : undefined;
    const endDate = booking.end_date ? new Date(booking.end_date) : undefined;
    
    const formattedBooking: FormBooking = {
      id: booking.id,
      customer_id: booking.customers?.id,
      itinerary_id: booking.itineraries?.id,
      start_date: startDate,
      end_date: endDate,
      status: booking.status,
      total_amount: booking.total_amount
    };
    
    setSelectedBooking(formattedBooking);
    setIsFormOpen(true);
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm("Are you sure you want to delete this booking? This will also delete all related payments.")) {
      try {
        const { error } = await supabase.from("bookings").delete().eq("id", id);
        if (error) throw error;
        
        setBookings(bookings.filter(booking => booking.id !== id));
        toast.success("Booking deleted successfully");
      } catch (error) {
        console.error("Error deleting booking:", error);
        toast.error("Failed to delete booking");
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchBookings();
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setPaymentFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
    setDateRange(undefined);
    setBookingDateRange(undefined);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Format travel dates from start_date and end_date
  const formatTravelDates = (start: string, end: string) => {
    try {
      if (!start || !end) return "No dates set";
      
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      
      return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
    } catch (e) {
      return "Invalid dates";
    }
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            handlePageChange(1);
          }}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(totalPages);
            }}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  // Helper to format booking ID
  const formatBookingId = (id: string) => {
    // Use the booking_number if available, otherwise generate a fallback
    const booking = bookings.find(b => b.id === id);
    if (booking?.booking_number) {
      return booking.booking_number;
    }
    // Fallback to a generated ID based on the UUID if booking_number is not available
    return `BOOK${id.slice(-6).toUpperCase()}`;
  };

  // Handler to open view dialog
  const handleViewBooking = (booking: Booking) => {
    setViewBooking(booking);
    setIsViewDialogOpen(true);
  };

  // Handler to update booking status
  const handleStatusChange = async (newStatus: string) => {
    if (!viewBooking) return;
    setStatusUpdating(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", viewBooking.id);
      if (error) throw error;
      setViewBooking({ ...viewBooking, status: newStatus });
      setBookings((prev) => prev.map(b => b.id === viewBooking.id ? { ...b, status: newStatus } : b));
      toast.success("Booking status updated");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleProcessPayment = (booking: Booking) => {
    setSelectedBookingForPayment(booking);
    setIsPaymentFormOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentFormOpen(false);
    setSelectedBookingForPayment(null);
    fetchBookings(); // Refresh the bookings list
  };

  // Calculate payment status based on all payments for the booking
  const calculatePaymentStatus = (booking: Booking) => {
    // Default status
    let status = "Unpaid";
    let color = "text-red-500";
    let amount = 0;
    let percentage = 0;
    
    // Calculate total paid amount
    if (booking.payments && booking.payments.length > 0) {
      const totalPaid = booking.payments.reduce((sum, payment) => 
        payment.status.toLowerCase() === "completed" ? sum + payment.amount : sum, 0);
      
      amount = totalPaid;
      percentage = Math.round((totalPaid / booking.total_amount) * 100);
      
      if (percentage >= 100) {
        status = "Paid";
        color = "text-green-500";
      } else if (percentage > 0) {
        status = "Partial";
        color = "text-amber-500";
      }
    }
    
    return { status, color, amount, percentage };
  };

  // Handle viewing payment details
  const handleViewPayment = (booking: Booking) => {
    // If there are payments, set the first one as selected
    if (booking.payments && booking.payments.length > 0) {
      const payment = booking.payments[0];
      setSelectedPaymentForView({
        id: payment.id,
        booking_id: booking.id,
        amount: payment.amount,
        status: payment.status,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method
      });
      setIsPaymentDetailDialogOpen(true);
    } else {
      toast.info("No payments found for this booking");
    }
  };

  // Handle updating payment status
  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!selectedPaymentForView) return;
    
    setPaymentStatusUpdating(true);
    try {
      // If there's no real payment yet, we'll need to create one instead of updating
      if (selectedPaymentForView.id === "no-payment") {
        const { error } = await supabase
          .from("payments")
          .insert({
            booking_id: selectedPaymentForView.booking_id,
            amount: 0, // Placeholder amount
            status: newStatus,
            payment_date: new Date().toISOString(),
            payment_method: "None",
            payment_id: `PAY-${Date.now().toString().slice(-6)}`
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payments")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", selectedPaymentForView.id);
        if (error) throw error;
      }
      
      setSelectedPaymentForView({ ...selectedPaymentForView, status: newStatus });
      toast.success("Payment status updated");
      fetchBookings(); // Refresh the data
    } catch (error) {
      toast.error("Failed to update payment status");
      console.error("Error updating payment status:", error);
    } finally {
      setPaymentStatusUpdating(false);
    }
  };

  // Handle viewing payment receipt
  const handleViewReceipt = () => {
    if (!selectedPaymentForView || selectedPaymentForView.id === "no-payment") {
      toast.error("No payment record available");
      return;
    }
    
    setIsReceiptViewerOpen(true);
  };

  // Handle sending payment receipt
  const handleSendReceipt = () => {
    if (!selectedPaymentForView || selectedPaymentForView.id === "no-payment") {
      toast.error("No payment record available");
      return;
    }
    
    // Use the shared function to handle email sending
    shareReceiptViaEmail({
      ...selectedPaymentForView,
      payment_id: selectedPaymentForView.payment_id || `PAY-${selectedPaymentForView.id.slice(-6)}`
    });
  };

  // Handle sending booking confirmation
  const handleSendConfirmation = (booking: Booking) => {
    // First check if the email server is running
    import('@/services/emailService').then(({ checkEmailServer }) => {
      checkEmailServer().then(isRunning => {
        if (!isRunning) {
          toast.error(
            'Email server is not running. Please start the server first.',
            {
              description: 'Run "cd server && npm run dev" in a terminal to start the email server.',
              duration: 5000,
              action: {
                label: 'Dismiss',
                onClick: () => {}
              }
            }
          );
          return;
        }
        
        // Check if customer email exists
        if (!booking.customers?.email) {
          // Prompt the user to enter a recipient email
          const recipientEmail = prompt("No customer email found. Please enter a recipient email address:");
          
          if (!recipientEmail) {
            toast.error("Email sending cancelled");
            return;
          }
          
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(recipientEmail)) {
            toast.error("Invalid email format");
            return;
          }
          
          // Send with provided email
          shareItineraryViaEmail(booking, recipientEmail);
        } else {
          // Use the customer's email
          shareItineraryViaEmail(booking);
        }
      });
    });
  };

  // Handle viewing booking itinerary
  const handleViewItinerary = (booking: Booking) => {
    setSelectedBookingForItinerary(booking);
    setIsItineraryViewerOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
        </div>
        <Button 
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600" 
          onClick={handleAddBooking}
        >
          New Booking
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search bookings..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Select 
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setTimeout(() => setCurrentPage(1), 0);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={paymentFilter}
            onValueChange={(value) => {
              setPaymentFilter(value);
              setTimeout(() => setCurrentPage(1), 0);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={isBookingDatePopoverOpen} onOpenChange={setIsBookingDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] flex items-center justify-between" type="button">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {bookingDateRange?.from && bookingDateRange?.to
                  ? `${format(bookingDateRange.from, "MMM d, yyyy")} - ${format(bookingDateRange.to, "MMM d, yyyy")}`
                  : bookingDateRange?.from
                  ? `${format(bookingDateRange.from, "MMM d, yyyy")}`
                  : "Booking Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={bookingDateRange}
                onSelect={setBookingDateRange}
                numberOfMonths={1}
                defaultMonth={bookingDateRange?.from || new Date()}
                toDate={addDays(new Date(), 365)}
              />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" onClick={handleClearFilters} className="hidden sm:flex">
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Itinerary</TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mr-2" />
                    <span>Loading bookings...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No bookings found. Try adjusting your filters or create a new booking.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking, idx) => (
                <TableRow key={booking.id}>
                  <TableCell>{formatBookingId(booking.id)}</TableCell>
                  <TableCell>{booking.customers?.name || "Unknown Customer"}</TableCell>
                  <TableCell>{booking.itineraries?.name || "Unknown Itinerary"}</TableCell>
                  <TableCell>{booking.created_at ? format(new Date(booking.created_at), "MMM d, yyyy") : "-"}</TableCell>
                  <TableCell>₹{booking.total_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === "Confirmed"
                          ? "bg-green-100 text-green-500"
                          : booking.status === "Pending"
                          ? "bg-yellow-100 text-yellow-500"
                          : booking.status === "Cancelled"
                          ? "bg-red-100 text-red-500"
                          : booking.status === "In Progress"
                          ? "bg-blue-100 text-blue-500"
                          : booking.status === "Completed"
                          ? "bg-emerald-100 text-emerald-500"
                          : "bg-purple-100 text-purple-500"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Calculate payment status once per row
                      const paymentStatus = calculatePaymentStatus(booking);
                      
                      return (
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              paymentStatus.status === "Paid" ? "bg-green-100 text-green-500" :
                              paymentStatus.status === "Partial" ? "bg-amber-100 text-amber-500" :
                              "bg-red-100 text-red-500"
                            }`}
                          >
                            {paymentStatus.status}
                          </span>
                          
                          {/* Payment Progress Bar for Partial Payments */}
                          {paymentStatus.status === "Partial" && (
                            <>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-emerald-500 h-1.5 rounded-full" 
                                  style={{ width: `${paymentStatus.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">
                                <span className="text-emerald-500 font-medium">₹{paymentStatus.amount.toLocaleString()}</span> paid
                                <span className="text-muted-foreground ml-1">({paymentStatus.percentage}%)</span>
                              </span>
                              <span className="text-xs font-medium text-red-500">
                                ₹{(booking.total_amount - paymentStatus.amount).toLocaleString()} remaining
                              </span>
                            </>
                          )}
                          {paymentStatus.status === "Unpaid" && (
                            <span className="text-xs text-red-500 font-medium">
                              ₹{(booking.total_amount - paymentStatus.amount).toLocaleString()} due
                            </span>
                          )}
                          {paymentStatus.status === "Paid" && (
                            <span className="text-xs text-emerald-500 font-medium">
                              ₹{paymentStatus.amount.toLocaleString()} paid in full
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleViewBooking(booking)} title="View Details" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="19" cy="12" r="1" />
                              <circle cx="5" cy="12" r="1" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditBooking(booking)}>Edit Booking</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleProcessPayment(booking)}>Process Payment</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewItinerary(booking)}>View Itinerary</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendConfirmation(booking)}>Send Itinerary</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => handleDeleteBooking(booking.id)}
                          >
                            Cancel Booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) handlePageChange(currentPage - 1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {getPaginationItems()}
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) handlePageChange(currentPage + 1);
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <FormDialog
        title={selectedBooking ? "Edit Booking" : "New Booking"}
        description={
          selectedBooking
            ? "Edit booking details."
            : "Create a new booking."
        }
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      >
        <BookingForm
          booking={selectedBooking}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      </FormDialog>

      {/* View Booking Dialog */}
      <FormDialog
        title="Booking Details"
        description="View and update booking details."
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
      >
        {viewBooking && (
          <div className="space-y-6">
            {/* Top section with basic booking info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - booking and customer info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Booking ID</div>
                  <div className="text-lg font-semibold">{formatBookingId(viewBooking.id)}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Customer</div>
                  <div className="font-medium">{viewBooking.customers?.name || "Unknown Customer"}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Itinerary</div>
                  <div className="font-medium">{viewBooking.itineraries?.name || "Unknown Itinerary"}</div>
                </div>
              </div>
              
              {/* Right side - dates and status */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Booking Date</div>
                  <div className="font-medium">{viewBooking.created_at ? format(new Date(viewBooking.created_at), "MMM d, yyyy") : "-"}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Total Amount</div>
                  <div className="text-lg font-semibold">₹{viewBooking.total_amount?.toLocaleString()}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Booking Status</div>
                  <Select
                    value={viewBooking.status}
                    onValueChange={handleStatusChange}
                    disabled={statusUpdating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Payment status section */}
            <div className="rounded-md border bg-card p-4 shadow-sm">
              {(() => {
                // Calculate payment status once
                const paymentStatus = calculatePaymentStatus(viewBooking);
                
                return (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Payment Status</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          paymentStatus.status === "Paid" ? "bg-green-100 text-green-500" :
                          paymentStatus.status === "Partial" ? "bg-amber-100 text-amber-500" :
                          "bg-red-100 text-red-500"
                        }`}
                      >
                        {paymentStatus.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Payment progress bar */}
                      {paymentStatus.status !== "Unpaid" && (
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span>Payment Progress</span>
                            <span className="font-medium">{paymentStatus.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`${paymentStatus.status === "Paid" ? "bg-emerald-500" : "bg-yellow-500"} h-2.5 rounded-full`}
                              style={{ width: `${paymentStatus.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Payment summary */}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="text-xs text-muted-foreground mb-1">Total</div>
                          <div className="font-medium">₹{viewBooking.total_amount.toLocaleString()}</div>
                        </div>
                        
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="text-xs text-muted-foreground mb-1">Paid</div>
                          <div className={`font-medium ${paymentStatus.amount > 0 ? "text-emerald-500" : ""}`}>
                            ₹{paymentStatus.amount.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="text-xs text-muted-foreground mb-1">Remaining</div>
                          <div className={`font-medium ${paymentStatus.amount < viewBooking.total_amount ? "text-red-500" : "text-emerald-500"}`}>
                            ₹{(viewBooking.total_amount - paymentStatus.amount).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Payment history section */}
                      {viewBooking.payments && viewBooking.payments.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium mb-2">Payment History</div>
                          <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="px-3 py-2 text-left">Date</th>
                                  <th className="px-3 py-2 text-right">Amount</th>
                                  <th className="px-3 py-2 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {viewBooking.payments.map(payment => (
                                  <tr key={payment.id}>
                                    <td className="px-3 py-2">{format(new Date(payment.payment_date), "MMM d, yyyy")}</td>
                                    <td className="px-3 py-2 text-right">₹{payment.amount.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right">
                                      <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                                        payment.status === "Completed" ? "bg-emerald-100 text-emerald-500" :
                                        payment.status === "Pending" ? "bg-yellow-100 text-yellow-500" :
                                        "bg-red-100 text-red-500"
                                      }`}>
                                        {payment.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            
            {/* Notes section if available */}
            {viewBooking.notes && (
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <div className="text-sm whitespace-pre-line">{viewBooking.notes}</div>
              </div>
            )}
            
            {/* Button group - right aligned */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditBooking(viewBooking);
                }}
              >
                Edit Booking
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (window.confirm("Are you sure you want to delete this booking? This will also delete all related payments.")) {
                    try {
                      const { error } = await supabase.from("bookings").delete().eq("id", viewBooking.id);
                      if (error) throw error;
                      setBookings(bookings.filter(b => b.id !== viewBooking.id));
                      setIsViewDialogOpen(false);
                      toast.success("Booking deleted successfully");
                    } catch (error) {
                      toast.error("Failed to delete booking");
                    }
                  }
                }}
              >
                Delete Booking
              </Button>
              <Button onClick={() => setIsViewDialogOpen(false)} className="bg-emerald-500 hover:bg-emerald-600">
                Close
              </Button>
            </div>
          </div>
        )}
      </FormDialog>

      {/* Payment Form Dialog */}
      <FormDialog
        title="Process Payment"
        description="Record a payment for this booking."
        isOpen={isPaymentFormOpen}
        onClose={() => {
          setIsPaymentFormOpen(false);
          setSelectedBookingForPayment(null);
        }}
      >
        <PaymentForm
          payment={{
            booking_id: selectedBookingForPayment?.id,
            amount: selectedBookingForPayment?.total_amount,
            payment_id: `PAY-${Date.now().toString().slice(-6)}`,
            payment_date: new Date(),
            status: "Pending",
            payment_method: "Credit Card"
          }}
          onSuccess={handlePaymentSuccess}
          onCancel={() => {
            setIsPaymentFormOpen(false);
            setSelectedBookingForPayment(null);
          }}
        />
      </FormDialog>

      {/* Payment Detail Dialog */}
      <FormDialog
        title="Payment Details"
        description="View and manage payment information."
        isOpen={isPaymentDetailDialogOpen}
        onClose={() => setIsPaymentDetailDialogOpen(false)}
      >
        {selectedPaymentForView && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Payment ID</div>
                <div className="font-medium">
                  {selectedPaymentForView.id === "no-payment" 
                    ? "No Payment Record" 
                    : `PAY-${selectedPaymentForView.id.slice(-6)}`
                  }
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Payment Date</div>
                <div>
                  {selectedPaymentForView.payment_date 
                    ? format(new Date(selectedPaymentForView.payment_date), "MMM d, yyyy") 
                    : "-"
                  }
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Amount</div>
                <div>
                  {selectedPaymentForView.id === "no-payment" 
                    ? "-" 
                    : `₹${selectedPaymentForView.amount?.toLocaleString()}`
                  }
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Payment Method</div>
                <div>{selectedPaymentForView.payment_method || "-"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Payment Status</div>
                <Select
                  value={selectedPaymentForView.status}
                  onValueChange={handlePaymentStatusChange}
                  disabled={paymentStatusUpdating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 pt-4 border-t mt-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  setIsPaymentDetailDialogOpen(false);
                  // This assumes you have an editPayment function
                  // which you would implement similar to handleProcessPayment
                  if (selectedPaymentForView.id !== "no-payment") {
                    handleProcessPayment(
                      bookings.find(b => b.id === selectedPaymentForView.booking_id) as Booking
                    );
                  } else {
                    handleProcessPayment(
                      bookings.find(b => b.id === selectedPaymentForView.booking_id) as Booking
                    );
                  }
                }}
              >
                <Edit className="h-4 w-4" /> Edit Payment
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleViewReceipt}
                disabled={selectedPaymentForView.id === "no-payment"}
              >
                <File className="h-4 w-4" /> View Receipt
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleSendReceipt}
                disabled={selectedPaymentForView.id === "no-payment"}
              >
                <Mail className="h-4 w-4" /> Send Receipt
              </Button>
              <Button 
                onClick={() => setIsPaymentDetailDialogOpen(false)} 
                className="ml-auto bg-emerald-500 hover:bg-emerald-600"
              >
                Close
              </Button>
            </div>
            
            {/* If there is payment history, show it */}
            {selectedPaymentForView.booking_id && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2">Payment History</div>
                {bookings
                  .find(b => b.id === selectedPaymentForView.booking_id)
                  ?.payments
                  ?.length > 0 ? (
                  <div className="space-y-2">
                    {bookings
                      .find(b => b.id === selectedPaymentForView.booking_id)
                      ?.payments
                      ?.map(payment => (
                      <div key={payment.id} className="flex justify-between items-center p-2 bg-muted rounded-md">
                        <div>{format(new Date(payment.payment_date), "MMM d, yyyy")}</div>
                        <div>₹{payment.amount.toLocaleString()}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === "Completed" ? "bg-emerald-100 text-emerald-500" :
                          payment.status === "Pending" ? "bg-yellow-100 text-yellow-500" :
                          "bg-red-100 text-red-500"
                        }`}>
                          {payment.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No payment records found.</div>
                )}
              </div>
            )}
          </div>
        )}
      </FormDialog>

      {/* Receipt Viewer Dialog */}
      <FormDialog
        title="Payment Receipt"
        description="View and download the payment receipt"
        isOpen={isReceiptViewerOpen}
        onClose={() => setIsReceiptViewerOpen(false)}
      >
        {selectedPaymentForView && selectedPaymentForView.id !== "no-payment" && (
          <div className="space-y-4 w-full" style={{ maxWidth: '850px' }}>
            <div className="w-full h-[600px] overflow-hidden">
              <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                <PaymentReceipt 
                  payment={{
                    ...selectedPaymentForView,
                    payment_id: selectedPaymentForView.payment_id || `PAY-${selectedPaymentForView.id.slice(-6)}`,
                    bookings: bookings.find(b => b.id === selectedPaymentForView.booking_id) || null
                  }}
                  companySettings={companySettings || undefined}
                />
              </PDFViewer>
            </div>
            <div className="flex justify-between pt-4 border-t">
              <ReceiptPDF 
                payment={{
                  ...selectedPaymentForView,
                  payment_id: selectedPaymentForView.payment_id || `PAY-${selectedPaymentForView.id.slice(-6)}`,
                  bookings: bookings.find(b => b.id === selectedPaymentForView.booking_id) || null
                }}
                buttonText="Download PDF" 
                fileName={`Payment_Receipt_${selectedPaymentForView.id}.pdf`}
              />
              <Button 
                onClick={() => setIsReceiptViewerOpen(false)} 
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </FormDialog>

      {/* Add the FormDialog for viewing the itinerary */}
      <FormDialog
        title="Booking Confirmation"
        description="View and download the booking confirmation"
        isOpen={isItineraryViewerOpen}
        onClose={() => setIsItineraryViewerOpen(false)}
      >
        {selectedBookingForItinerary && (
          <div className="space-y-4 w-full" style={{ maxWidth: '850px' }}>
            <div className="w-full h-[600px] overflow-hidden">
              <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                <BookingItinerary 
                  booking={selectedBookingForItinerary}
                  companySettings={companySettings || undefined}
                />
              </PDFViewer>
            </div>
            <div className="flex justify-between pt-4 border-t">
              <ItineraryPDF 
                booking={selectedBookingForItinerary}
                buttonText="Download PDF" 
                fileName={`Booking_Confirmation_${formatBookingId(selectedBookingForItinerary.id)}.pdf`}
              />
              <Button 
                onClick={() => setIsItineraryViewerOpen(false)} 
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  );
}

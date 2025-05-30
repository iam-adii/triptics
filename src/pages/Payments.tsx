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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, MoreVertical, CreditCard, File, Mail, Edit } from "lucide-react";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { FormDialog } from "@/components/ui/form-dialog";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useDebounce } from "@/hooks/useDebounce";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import ReceiptPDF, { shareReceiptViaEmail } from "@/components/ReceiptPDF";
import { PDFViewer } from '@react-pdf/renderer';
import PaymentReceipt from '@/components/PaymentReceipt';
import { useCompanySettings } from '@/contexts/CompanySettingsContext';
import { LineChart, Line, ResponsiveContainer } from "recharts";

// Define payment type to avoid deep type instantiation issues
interface Booking {
  id: string;
  customers?: {
    name: string;
    email: string;
  } | null;
}

interface Payment {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
  method: string;
  date: string;
  payment_type?: string;
  notes?: string | null;
  bookings: Booking | null;
}

// Define form payment type to match PaymentForm expectations
interface FormPayment {
  id?: string;
  booking_id?: string;
  payment_id?: string;
  amount?: number;
  method?: string;
  date?: Date;
  status?: string;
  payment_type?: string;
  notes?: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalReceived: 0,
    pending: 0,
    outstanding: 0,
  });
  const [chartData, setChartData] = useState({
    received: [
      { value: 40000 },
      { value: 45000 },
      { value: 42000 },
      { value: 49000 },
      { value: 60000 },
      { value: 55000 },
      { value: 63000 },
    ],
    pending: [
      { value: 15000 },
      { value: 20000 },
      { value: 18000 },
      { value: 22000 },
      { value: 35000 },
      { value: 42000 },
      { value: 50000 },
    ],
    outstanding: [
      { value: 35000 },
      { value: 42000 },
      { value: 45000 },
      { value: 50000 },
      { value: 55000 },
      { value: 58000 },
      { value: 60000 },
    ]
  });
  const [selectedPayment, setSelectedPayment] = useState<FormPayment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isPaymentDetailDialogOpen, setIsPaymentDetailDialogOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [paymentStatusUpdating, setPaymentStatusUpdating] = useState(false);
  const [isReceiptViewerOpen, setIsReceiptViewerOpen] = useState(false);
  const { companySettings } = useCompanySettings();
  
  // Use debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchQuery, 500);

  // Fetch payments on component mount or when filters change
  useEffect(() => {
    fetchPayments();
    fetchSummary();
  }, [statusFilter, debouncedSearchTerm, currentPage]);

  async function fetchPayments() {
    setLoading(true);
    try {
      // Create a more complex query to join related tables
      const query = supabase
        .from("payments")
        .select(`
          id,
          payment_id,
          amount,
          status,
          method,
          date,
          payment_type,
          notes,
          bookings (
            id,
            customers (name, email)
          )
        `);
      
      if (statusFilter !== "all") {
        query.eq("status", statusFilter);
      }
      
      if (debouncedSearchTerm) {
        query.or(`payment_id.ilike.%${debouncedSearchTerm}%,bookings.customers.name.ilike.%${debouncedSearchTerm}%`);
      }
      
      // Count total records for pagination
      const { count, error: countError } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true });
      
      if (countError) throw countError;
      
      // Calculate total pages
      if (count !== null) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
      
      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      // Get paginated data
      const { data, error } = await query
        .order("date", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      if (data) {
        // Type-safe casting of the data
        const typedData = data as unknown as Payment[];
        let filteredData = typedData;
        // Date range filter (client-side)
        if (dateRange?.from && dateRange?.to) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          filteredData = filteredData.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= fromDate && paymentDate <= toDate;
          });
        }
        setPayments(filteredData);
        setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSummary() {
    try {
      // Get total of completed payments
      const { data: completedData, error: completedError } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "Completed");
        
      if (completedError) throw completedError;
      
      // Get total of pending payments
      const { data: pendingData, error: pendingError } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "Pending");
        
      if (pendingError) throw pendingError;
      
      // Get total bookings amount to calculate outstanding
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("total_amount");
        
      if (bookingsError) throw bookingsError;
      
      // Calculate summary data
      const totalReceived = completedData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const pending = pendingData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const totalBookings = bookingsData?.reduce((sum, item) => sum + item.total_amount, 0) || 0;
      const outstanding = totalBookings - totalReceived - pending;
      
      setSummaryData({
        totalReceived,
        pending,
        outstanding: outstanding > 0 ? outstanding : 0,
      });
    } catch (error) {
      console.error("Error fetching summary data:", error);
    }
  }

  const handleAddPayment = () => {
    setSelectedPayment(null);
    setIsFormOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    // Convert string date to Date object for the form
    const paymentDate = payment.date ? new Date(payment.date) : new Date();
    
    const formattedPayment: FormPayment = {
      id: payment.id,
      booking_id: payment.bookings?.id,
      payment_id: payment.payment_id,
      amount: payment.amount,
      method: payment.method,
      date: paymentDate,
      status: payment.status,
      payment_type: payment.payment_type,
      notes: payment.notes
    };
    
    setSelectedPayment(formattedPayment);
    setIsFormOpen(true);
  };

  const handleDeletePayment = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment?")) {
      try {
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) throw error;
        
        setPayments(payments.filter(payment => payment.id !== id));
        fetchSummary(); // Refresh summary data
        toast.success("Payment deleted successfully");
      } catch (error) {
        console.error("Error deleting payment:", error);
        toast.error("Failed to delete payment");
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchPayments();
    fetchSummary();
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleMarkAsCompleted = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ status: "Completed" })
        .eq("id", id);
        
      if (error) throw error;
      
      // Update local state
      setPayments(payments.map(payment => 
        payment.id === id ? { ...payment, status: "Completed" } : payment
      ));
      
      fetchSummary(); // Refresh summary data
      toast.success("Payment marked as completed");
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment status");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
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

  // Helper to format booking ID (same as in Bookings page)
  const formatBookingId = (id: string) => {
    // Fallback to a generated ID based on the UUID if booking_number is not available
    return `BOOK${id.slice(-6).toUpperCase()}`;
  };

  // Handle viewing payment details
  const handleViewPaymentDetails = (payment: Payment) => {
    setViewPayment(payment);
    setIsPaymentDetailDialogOpen(true);
  };

  // Handle updating payment status
  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!viewPayment) return;
    
    setPaymentStatusUpdating(true);
    try {
      const { error } = await supabase
        .from("payments")
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", viewPayment.id);
      
      if (error) throw error;
      
      setViewPayment({ ...viewPayment, status: newStatus });
      setPayments(payments.map(p => p.id === viewPayment.id ? { ...p, status: newStatus } : p));
      fetchSummary(); // Refresh summary data
      toast.success("Payment status updated");
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status");
    } finally {
      setPaymentStatusUpdating(false);
    }
  };

  // Handle viewing payment receipt
  const handleViewReceipt = () => {
    if (!viewPayment) return;
    setIsReceiptViewerOpen(true);
  };

  // Handle sending payment receipt
  const handleSendReceipt = () => {
    if (!viewPayment) return;
    
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
        if (!viewPayment.bookings?.customers?.email) {
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
          shareReceiptViaEmail(viewPayment, recipientEmail);
        } else {
          // Use the customer's email
          shareReceiptViaEmail(viewPayment);
        }
      });
    });
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Payments</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage and track all payment transactions.
          </p>
        </div>
        <Button 
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 py-5 sm:py-2" 
          onClick={handleAddPayment}
        >
          Record Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-secondary/50 border-border/30 overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">
              Total Received
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-3xl font-bold text-emerald-500">₹{summaryData.totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="mt-3 h-[30px] sm:h-[40px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.received}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/50 border-border/30 overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-3xl font-bold text-yellow-500">₹{summaryData.pending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="mt-3 h-[30px] sm:h-[40px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.pending}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#eab308"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/50 border-border/30 overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-3xl font-bold text-red-500">₹{summaryData.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="mt-3 h-[30px] sm:h-[40px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.outstanding}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search payments..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setTimeout(() => setCurrentPage(1), 0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          {/* Date Range Picker */}
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] flex items-center justify-between" type="button">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                  : "Payment Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                defaultMonth={dateRange?.from || new Date()}
                toDate={addDays(new Date(), 365)}
              />
            </PopoverContent>
          </Popover>
          <Button 
            variant="ghost" 
            onClick={handleClearFilters} 
            className="w-full sm:w-auto"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Desktop table view - hidden on mobile */}
      <div className="border rounded-md overflow-hidden hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Payment ID</TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mr-2" />
                    <span>Loading payments...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No payments found. Try adjusting your filters or record a new payment.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment, idx) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.payment_id}</TableCell>
                  <TableCell>{payment.bookings?.id ? formatBookingId(payment.bookings.id) : "Unknown"}</TableCell>
                  <TableCell>{payment.bookings?.customers?.name || "Unknown"}</TableCell>
                  <TableCell className="font-medium">₹{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-500"
                          : payment.status === "Pending"
                          ? "bg-yellow-500/20 text-yellow-500"
                          : payment.status === "Failed"
                          ? "bg-red-500/20 text-red-500"
                          : "bg-blue-500/20 text-blue-500"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{payment.payment_type || "Full"}</TableCell>
                  <TableCell>{formatDate(payment.date)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewPaymentDetails(payment)} 
                        title="View Payment Details"
                        className="h-8 w-8 p-0"
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPayment(payment)}>View/Edit Payment</DropdownMenuItem>
                          <DropdownMenuItem>Send Receipt</DropdownMenuItem>
                          {payment.status === "Pending" && (
                            <DropdownMenuItem onClick={() => handleMarkAsCompleted(payment.id)}>
                              Mark as Completed
                            </DropdownMenuItem>
                          )}
                          {payment.status === "Completed" && (
                            <DropdownMenuItem className="text-red-500">Issue Refund</DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => handleDeletePayment(payment.id)}
                          >
                            Delete Payment
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

      {/* Mobile card view - shown only on mobile */}
      <div className="sm:hidden space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mr-2" />
            <span>Loading payments...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 px-4 border rounded-md">
            No payments found. Try adjusting your filters or record a new payment.
          </div>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 flex justify-between items-center border-b">
                  <div>
                    <p className="font-semibold">{payment.payment_id}</p>
                    <p className="text-sm text-muted-foreground">{payment.bookings?.customers?.name || "Unknown"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-500"
                          : payment.status === "Pending"
                          ? "bg-yellow-500/20 text-yellow-500"
                          : payment.status === "Failed"
                          ? "bg-red-500/20 text-red-500"
                          : "bg-blue-500/20 text-blue-500"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center text-sm">
                  <div>
                    <p className="text-muted-foreground">Method: {payment.method}</p>
                    <p className="text-muted-foreground">Type: {payment.payment_type || "Full"}</p>
                    <p className="text-muted-foreground">Date: {formatDate(payment.date)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewPaymentDetails(payment)} 
                      className="h-8 w-8 p-0"
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPayment(payment)}>View/Edit Payment</DropdownMenuItem>
                        <DropdownMenuItem>Send Receipt</DropdownMenuItem>
                        {payment.status === "Pending" && (
                          <DropdownMenuItem onClick={() => handleMarkAsCompleted(payment.id)}>
                            Mark as Completed
                          </DropdownMenuItem>
                        )}
                        {payment.status === "Completed" && (
                          <DropdownMenuItem className="text-red-500">Issue Refund</DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          Delete Payment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent className="flex-wrap">
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
        title={selectedPayment ? "Edit Payment" : "Record Payment"}
        description={
          selectedPayment
            ? "Edit payment details."
            : "Record a new payment for a booking."
        }
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      >
        <PaymentForm
          payment={selectedPayment}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      </FormDialog>

      {/* Payment Detail Dialog */}
      <FormDialog
        title="Payment Details"
        description="View and manage payment information."
        isOpen={isPaymentDetailDialogOpen}
        onClose={() => setIsPaymentDetailDialogOpen(false)}
      >
        {viewPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Payment ID</div>
                <div className="font-medium">{viewPayment.payment_id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div>{formatDate(viewPayment.date)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="font-medium">₹{viewPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Method</div>
                <div>{viewPayment.method}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Payment Type</div>
                <div>{viewPayment.payment_type || 'Full'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Customer</div>
                <div>{viewPayment.bookings?.customers?.name || "Unknown"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Booking</div>
                <div>{viewPayment.bookings?.id ? formatBookingId(viewPayment.bookings.id) : "Unknown"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Payment Status</div>
                <Select
                  value={viewPayment.status}
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
            
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  setIsPaymentDetailDialogOpen(false);
                  handleEditPayment(viewPayment);
                }}
              >
                <Edit className="h-4 w-4" /> Edit Payment
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleViewReceipt}
              >
                <File className="h-4 w-4" /> View Receipt
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleSendReceipt}
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
            
            {/* Transaction details or additional info could go here */}
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between">
                <div className="text-sm font-medium">Transaction Details</div>
                <div className="text-sm text-muted-foreground">
                  Updated: {format(parseISO(viewPayment.date), "PPpp")}
                </div>
              </div>
              <div className="mt-2 p-3 bg-muted/50 rounded-md">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Transaction Type</div>
                  <div>Online Payment</div>
                  <div className="text-muted-foreground">Payment Type</div>
                  <div>{viewPayment.payment_type || 'Full'}</div>
                  <div className="text-muted-foreground">Payment For</div>
                  <div>{viewPayment.bookings?.id ? "Booking" : "Other"}</div>
                  <div className="text-muted-foreground">Reference</div>
                  <div>{viewPayment.payment_id}</div>
                  {viewPayment.notes && (
                    <>
                      <div className="text-muted-foreground">Notes</div>
                      <div>{viewPayment.notes}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
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
        {viewPayment && (
          <div className="space-y-4 w-full" style={{ maxWidth: '850px' }}>
            <div className="w-full h-[600px] overflow-hidden">
              <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                <PaymentReceipt payment={viewPayment} companySettings={companySettings || undefined} />
              </PDFViewer>
            </div>
            <div className="flex justify-between pt-4 border-t">
              <ReceiptPDF 
                payment={viewPayment} 
                buttonText="Download PDF" 
                fileName={`Payment_Receipt_${viewPayment.payment_id}.pdf`}
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
    </div>
  );
}

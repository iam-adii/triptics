import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { ComboboxSafe } from "@/components/ui/combobox-safe";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/PageLoader";
import { useLoading } from "@/contexts/LoadingContext";
import { generatePDF } from "@/utils/pdf";
import { formatPhoneNumber } from "@/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Search, Loader2, MoreHorizontal, Eye, Download, Share2, Filter, ChevronDown, Check, CalendarIcon, Clock, PlusCircle, X, Trash2, Mail } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DateRange } from "react-day-picker";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import TransferDetails from "@/components/TransferDetails";
import { pdf } from "@react-pdf/renderer";

interface Transfer {
  id: string;
  customer_id: string;
  vehicle_type: string;
  vehicle_number: string;
  pickup_location: string;
  drop_location: string;
  pickup_datetime: string;
  driver_name: string;
  driver_contact: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export default function Transfers() {
  const { setLoading } = useLoading();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_type: "",
    vehicle_number: "",
    pickup_location: "",
    drop_location: "",
    pickup_date: new Date(),
    pickup_time: "",
    driver_name: "",
    driver_contact: "",
    notes: "",
  });
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [viewTransfer, setViewTransfer] = useState<(Transfer & { customers: Customer }) | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [vehicleType, setVehicleType] = useState<string>("all");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const rowsPerPage = 10;

  const debouncedSearchTerm = useDebounce(searchQuery, 300);

  // Fetch customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email")
        .order("name");
      
      if (error) throw error;
      return data as Customer[];
    },
  });

  // Debug: log customers to console
  console.log('customers:', customers);

  // Fetch transfers with customer details
  const { data: transfers, isLoading: isLoadingTransfers } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfers")
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            email
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as (Transfer & { customers: Customer })[];
    },
  });

  // Create transfer mutation
  const createTransfer = useMutation({
    mutationFn: async (transferData: Omit<Transfer, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("transfers")
        .insert([transferData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Transfer created successfully");
      setShowPreview(false);
      setFormData({
        vehicle_type: "",
        vehicle_number: "",
        pickup_location: "",
        drop_location: "",
        pickup_date: new Date(),
        pickup_time: "",
        driver_name: "",
        driver_contact: "",
        notes: "",
      });
      setSelectedCustomer(null);
      // Invalidate transfers query to refresh data
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
    },
    onError: (error) => {
      toast.error("Failed to create transfer");
      console.error(error);
    },
  });

  // Delete transfer mutation
  const deleteTransfer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transfers")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success("Transfer deleted successfully");
      // Invalidate transfers query to refresh data
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
    },
    onError: (error) => {
      toast.error("Failed to delete transfer");
      console.error(error);
    },
  });

  // Effect to filter customers based on search query
  useEffect(() => {
    if (!debouncedSearchTerm || !Array.isArray(customers)) {
      setFilteredCustomers([]);
      return;
    }

    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
      customer.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    ).slice(0, 5); // limit to 5 results
    
    setFilteredCustomers(filtered);
  }, [debouncedSearchTerm, customers]);

  // Handle selecting a customer from suggestions
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredCustomers.length === 0) return;
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev + 1) % filteredCustomers.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => (prev - 1 + filteredCustomers.length) % filteredCustomers.length);
      e.preventDefault();
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handleSelectCustomer(filteredCustomers[highlightedIndex]);
      e.preventDefault();
    }
  };

  const handleSaveAndShareWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    // Validate required fields
    const requiredFields = [
      "vehicle_type",
      "vehicle_number",
      "pickup_location",
      "drop_location",
      "pickup_date",
      "pickup_time",
      "driver_name",
      "driver_contact",
    ];

    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      // Combine date and time into a datetime string
      const dateStr = format(formData.pickup_date, "yyyy-MM-dd");
      const timeStr = formData.pickup_time;
      const pickup_datetime = `${dateStr}T${timeStr}`;
      
      const transferData = {
        customer_id: selectedCustomer.id,
        ...formData,
        pickup_datetime
      };
      delete transferData.pickup_date;
      delete transferData.pickup_time;

      // Save the transfer first
      await createTransfer.mutateAsync(transferData);

      // Format phone number for WhatsApp
      let phone = selectedCustomer.phone || "";
      phone = formatPhoneForWhatsApp(phone);
      
      // Format pickup date and time
      let formattedDateTime = "";
      try {
        formattedDateTime = format(new Date(pickup_datetime), "EEEE, MMMM d, yyyy 'at' h:mm a");
      } catch (e) {
        formattedDateTime = pickup_datetime;
      }

      // Generate and share via WhatsApp with improved formatting
      const message = `*Transfer Details* 🚗\n\n` +
        `👤 *Customer:* ${selectedCustomer.name}\n` +
        `🚘 *Vehicle:* ${formData.vehicle_type} - ${formData.vehicle_number}\n` +
        `📍 *Pickup:* ${formData.pickup_location}\n` +
        `🏁 *Drop:* ${formData.drop_location}\n` +
        `🗓️ *Date & Time:* ${formattedDateTime}\n` +
        `👨‍✈️ *Driver:* ${formData.driver_name}\n` +
        `📞 *Driver Contact:* ${formatPhoneNumber(formData.driver_contact)}\n` +
        (formData.notes ? `📝 *Notes:* ${formData.notes}\n` : "");

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
      
      // Close the dialog
      setShowDialog(false);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndDownloadPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    // Validate required fields
    const requiredFields = [
      "vehicle_type",
      "vehicle_number",
      "pickup_location",
      "drop_location",
      "pickup_date",
      "pickup_time",
      "driver_name",
      "driver_contact",
    ];

    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      // Combine date and time into a datetime string
      const dateStr = format(formData.pickup_date, "yyyy-MM-dd");
      const timeStr = formData.pickup_time;
      const pickup_datetime = `${dateStr}T${timeStr}`;
      
      const transferData = {
        customer_id: selectedCustomer.id,
        ...formData,
        pickup_datetime
      };
      delete transferData.pickup_date;
      delete transferData.pickup_time;

      // Save the transfer first
      await createTransfer.mutateAsync(transferData);

      // Format pickup date and time
      let formattedDateTime = "";
      try {
        formattedDateTime = format(new Date(pickup_datetime), "EEEE, MMMM d, yyyy 'at' h:mm a");
      } catch (e) {
        formattedDateTime = pickup_datetime;
      }

      // Process text fields to ensure they don't cause overlapping in PDF
      const processTextForPDF = (text: string, maxLength = 50) => {
        if (!text) return "N/A";
        // Return text as is if it's short enough
        if (text.length <= maxLength) return text;
        // Add line breaks for better formatting in PDF
        return text;
      };

      console.log("Generating PDF with data:", {
        title: "Transfer Details",
        content: {
          sections: [
            {
              rows: [
                ["Field", "Details"],
                ["Customer", selectedCustomer.name],
                ["Vehicle Type", formData.vehicle_type],
                ["Vehicle Number", formData.vehicle_number],
                ["Pickup Location", processTextForPDF(formData.pickup_location)],
                ["Drop Location", processTextForPDF(formData.drop_location)],
                ["Pickup Date & Time", formattedDateTime],
                ["Driver Name", formData.driver_name],
                ["Driver Contact", formatPhoneNumber(formData.driver_contact)],
                ["Notes", processTextForPDF(formData.notes || "N/A", 100)],
              ]
            }
          ]
        }
      });
      
      // Generate PDF
      const pdfBlob = await generatePDF({
        title: "Transfer Details",
        content: {
          sections: [
            {
              rows: [
                ["Field", "Details"],
                ["Customer", selectedCustomer.name],
                ["Vehicle Type", formData.vehicle_type],
                ["Vehicle Number", formData.vehicle_number],
                ["Pickup Location", processTextForPDF(formData.pickup_location)],
                ["Drop Location", processTextForPDF(formData.drop_location)],
                ["Pickup Date & Time", formattedDateTime],
                ["Driver Name", formData.driver_name],
                ["Driver Contact", formatPhoneNumber(formData.driver_contact)],
                ["Notes", processTextForPDF(formData.notes || "N/A", 100)],
              ]
            }
          ]
        }
      });

      console.log("PDF generated successfully:", pdfBlob);

      // Download PDF
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transfer_${selectedCustomer.name}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Close the dialog
      setShowDialog(false);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing a transfer
  const handleViewTransfer = (transfer: Transfer & { customers: Customer }) => {
    setViewTransfer(transfer);
    setShowViewDialog(true);
  };
  
  // Handle sharing a transfer via WhatsApp
  const handleShareTransfer = async (transfer: Transfer & { customers: Customer }) => {
    const customer = transfer.customers;
    if (!customer) {
      toast.error("Customer details not found");
      return;
    }
    
    // Format phone number for WhatsApp
    let phone = customer.phone || "";
    phone = formatPhoneForWhatsApp(phone);
    
    // Format pickup date and time
    let formattedDateTime = "";
    try {
      formattedDateTime = format(new Date(transfer.pickup_datetime), "EEEE, MMMM d, yyyy 'at' h:mm a");
    } catch (e) {
      formattedDateTime = transfer.pickup_datetime;
    }
    
    // Create a well-formatted message with emojis
    const message = `*Transfer Details* 🚗\n\n` +
      `👤 *Customer:* ${customer.name}\n` +
      `🚘 *Vehicle:* ${transfer.vehicle_type} - ${transfer.vehicle_number}\n` +
      `📍 *Pickup:* ${transfer.pickup_location}\n` +
      `🏁 *Drop:* ${transfer.drop_location}\n` +
      `🗓️ *Date & Time:* ${formattedDateTime}\n` +
      `👨‍✈️ *Driver:* ${transfer.driver_name}\n` +
      `📞 *Driver Contact:* ${formatPhoneNumber(transfer.driver_contact)}\n` +
      (transfer.notes ? `📝 *Notes:* ${transfer.notes}\n` : "");

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };
  
  // Handle downloading a transfer PDF
  const handleDownloadTransferPDF = async (transfer: Transfer & { customers: Customer }) => {
    const customer = transfer.customers;
    if (!customer) {
      toast.error("Customer details not found");
      return;
    }
    
    setLoading(true);
    try {
      // Get company settings
      const { data: companySettings } = await supabase
        .from("company_settings")
        .select("*")
        .single();
      
      // Generate PDF using the TransferDetails component
      const pdfDoc = pdf(<TransferDetails transfer={transfer} companySettings={companySettings} />);
      const pdfBlob = await pdfDoc.toBlob();
      
      console.log("PDF generated successfully:", pdfBlob);

      // Download PDF
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transfer_${customer.name}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a transfer
  const handleDeleteTransfer = (transfer: Transfer & { customers: Customer }) => {
    if (confirm(`Are you sure you want to delete the transfer for ${transfer.customers?.name}?`)) {
      deleteTransfer.mutate(transfer.id);
    }
  };

  // Filter and paginate transfers
  const filteredTransfers = transfers?.filter(transfer => {
    // Apply text search filter
    const searchMatch = !searchText
      ? true
      : (transfer.customers?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
         transfer.pickup_location.toLowerCase().includes(searchText.toLowerCase()) ||
         transfer.drop_location.toLowerCase().includes(searchText.toLowerCase()) ||
         transfer.driver_name.toLowerCase().includes(searchText.toLowerCase()));
    
    // Apply status filter (we could add more status filters later)
    let statusMatch = true;
    if (filterStatus === "upcoming") {
      statusMatch = new Date(transfer.pickup_datetime) >= new Date();
    } else if (filterStatus === "completed") {
      statusMatch = new Date(transfer.pickup_datetime) < new Date();
    }
    
    // Apply date range filter
    let dateMatch = true;
    if (dateRange?.from && dateRange?.to) {
      try {
        dateMatch = isWithinInterval(new Date(transfer.pickup_datetime), {
          start: dateRange.from,
          end: dateRange.to,
        });
      } catch (e) {
        dateMatch = true;
      }
    }

    // Apply vehicle type filter
    const vehicleTypeMatch = vehicleType === "all" ? true : transfer.vehicle_type === vehicleType;
    
    return searchMatch && statusMatch && dateMatch && vehicleTypeMatch;
  }) || [];
  
  // Get paginated data
  const paginatedTransfers = filteredTransfers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredTransfers.length / rowsPerPage));

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");
    
    // Ensure phone has country code
    if (cleaned.length === 10) {
      // Add India country code if it's a 10-digit number
      cleaned = `91${cleaned}`;
    } else if (cleaned.startsWith("+91")) {
      // Remove the + sign if present
      cleaned = cleaned.substring(1);
    } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
      // Remove leading 0 and add 91
      cleaned = `91${cleaned.substring(1)}`;
    } else if (!cleaned.startsWith("91")) {
      // If no country code, add it
      cleaned = `91${cleaned}`;
    }
    
    return cleaned;
  };

  // Handle sharing a transfer via email
  const shareTransferViaEmail = async (transfer: Transfer & { customers: Customer }) => {
    const customer = transfer.customers;
    
    if (!customer) {
      toast.error("Customer details not found");
      return;
    }
    
    // First check if the email server is running
    import('@/services/emailService').then(({ checkEmailServer, sendTransferDetails }) => {
      checkEmailServer().then(async isRunning => {
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
        if (!customer.email) {
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
          
          // Continue with the provided email
          handleEmailSend(recipientEmail);
        } else {
          // Use customer's email
          handleEmailSend(customer.email);
        }
      });
    });
    
    // Helper function to handle the email sending process
    const handleEmailSend = async (recipientEmail: string) => {
      setLoading(true);
      try {
        // Get company settings
        const { data: companySettings } = await supabase
          .from("company_settings")
          .select("*")
          .single();
        
        // Format pickup date and time
        let formattedDateTime = "";
        try {
          formattedDateTime = format(new Date(transfer.pickup_datetime), "EEEE, MMMM d, yyyy 'at' h:mm a");
        } catch (e) {
          formattedDateTime = transfer.pickup_datetime;
        }
        
        // Generate PDF using the TransferDetails component
        const pdfDoc = pdf(<TransferDetails transfer={transfer} companySettings={companySettings} />);
        const pdfBlob = await pdfDoc.toBlob();
        
        // Convert blob to Uint8Array for email attachment
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Import email service
        const { sendTransferDetails } = await import('@/services/emailService');
        
        // Prepare transfer details for email
        const transferDetailsForEmail = {
          transferId: `TRAN${transfer.id.slice(-6).toUpperCase()}`,
          customerName: customer.name,
          vehicleType: transfer.vehicle_type,
          vehicleNumber: transfer.vehicle_number,
          pickupLocation: transfer.pickup_location,
          dropLocation: transfer.drop_location,
          dateTime: formattedDateTime,
          driverName: transfer.driver_name,
          driverContact: formatPhoneNumber(transfer.driver_contact)
        };
        
        // Show loading toast
        const loadingToast = toast.loading('Sending transfer details via email...');
        
        // Send email
        const result = await sendTransferDetails(
          recipientEmail,
          transferDetailsForEmail,
          uint8Array
        );
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (result.success) {
          toast.success(`Transfer details sent to ${recipientEmail}`);
        } else {
          toast.error(`Failed to send transfer details: ${result.error}`);
        }
      } catch (error: any) {
        console.error('Error sending transfer details via email:', error);
        toast.error('Failed to send transfer details: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
  };

  if (isLoadingCustomers || isLoadingTransfers) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transfers</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage cab transfers for customers.
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Transfer
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, location or driver..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Date Range Selector */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 h-10">
                <CalendarIcon className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span className="hidden sm:inline">
                      {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span className="hidden sm:inline">{format(dateRange.from, "MMM d, yyyy")}</span>
                  )
                ) : (
                  <span className="hidden sm:inline">Date Range</span>
                )}
                <span className="sm:hidden">Date</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
              />
              <div className="flex items-center justify-between p-3 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
                  Clear
                </Button>
                <Button size="sm" onClick={() => setIsDatePickerOpen(false)}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Vehicle Type Filter */}
          <Select value={vehicleType} onValueChange={setVehicleType}>
            <SelectTrigger className="w-[130px] h-10">
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              <SelectItem value="sedan">Sedan</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
              <SelectItem value="van">Van</SelectItem>
            </SelectContent>
          </Select>

          {/* More Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 h-10">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">More Filters</span>
                <span className="sm:hidden">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter By Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterStatus("all")} className="flex items-center justify-between">
                All Transfers
                {filterStatus === "all" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("upcoming")} className="flex items-center justify-between">
                Upcoming
                {filterStatus === "upcoming" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("completed")} className="flex items-center justify-between">
                Completed
                {filterStatus === "completed" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setSearchText("");
                    setFilterStatus("all");
                    setDateRange(undefined);
                    setVehicleType("all");
                  }}
                  className="h-10 w-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear all filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Recent Transfers Table */}
      <div className="border rounded-lg bg-white dark:bg-gray-950 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Vehicle</TableHead>
              <TableHead className="hidden md:table-cell">Pickup</TableHead>
              <TableHead className="hidden md:table-cell">Drop</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead className="hidden sm:table-cell">Driver</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingTransfers ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedTransfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <p className="mb-2">No transfers found</p>
                    {searchText && <p className="text-sm">Try adjusting your search or filters</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransfers.map((transfer) => (
                <TableRow key={transfer.id} className="group">
                  <TableCell className="font-medium">
                    <div>{transfer.customers?.name}</div>
                    <div className="text-xs text-muted-foreground sm:hidden mt-1">
                      {transfer.vehicle_type} - {format(new Date(transfer.pickup_datetime), "MMM d, h:mm a")}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{transfer.vehicle_type} - {transfer.vehicle_number}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[150px] truncate" title={transfer.pickup_location}>
                    {transfer.pickup_location}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[150px] truncate" title={transfer.drop_location}>
                    {transfer.drop_location}
                  </TableCell>
                  <TableCell>{format(new Date(transfer.pickup_datetime), "PPp")}</TableCell>
                  <TableCell className="hidden sm:table-cell">{transfer.driver_name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewTransfer(transfer)}
                              className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100"
                            >
                              <Eye className="h-4 w-4 text-emerald-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>View transfer details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewTransfer(transfer)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadTransferPDF(transfer)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareTransfer(transfer)}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share on WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareTransferViaEmail(transfer)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTransfer(transfer)}
                            className="text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

      {/* Pagination */}
      {filteredTransfers.length > 0 && (
        <div className="flex justify-center mt-4">
          <Pagination className="w-full sm:w-auto">
            <PaginationContent className="flex-wrap">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 ? setCurrentPage(p => p - 1) : null}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {/* Hide page numbers on very small screens */}
              <div className="hidden xs:flex">
              {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                // Show different sets of pages numbers depending on current page
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                if (pageNumber > totalPages) return null;
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={currentPage === pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              </div>
              
              {/* Show page counter on small screens */}
              <div className="flex xs:hidden items-center px-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages ? setCurrentPage(p => p + 1) : null}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create Transfer Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="p-4 sm:p-6 w-[95vw] sm:max-w-[600px] bg-background sm:rounded-lg gap-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 dark:text-emerald-500 flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Transfer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAndShareWhatsApp} className="space-y-4 mt-2">
            <div className="space-y-2 relative">
              <Label>Customer</Label>
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    if (!e.target.value) {
                      setSelectedCustomer(null);
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for a customer..."
                  className="pr-10"
                  disabled={isLoadingCustomers}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
              {showSuggestions && searchQuery.length >= 2 && (
                <div className="absolute z-10 left-0 top-[72px] w-full rounded shadow max-h-60 overflow-auto border border-border bg-popover text-popover-foreground">
                  {isLoadingCustomers ? (
                    <div className="p-3 text-center text-muted-foreground text-sm">Searching...</div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-muted-foreground text-sm">No customers found</div>
                  ) : (
                    filteredCustomers.map((customer, idx) => (
                      <div
                        key={customer.id}
                        className={`px-4 py-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900 ${highlightedIndex === idx ? 'bg-emerald-100 dark:bg-emerald-800' : ''}`}
                        onMouseDown={() => handleSelectCustomer(customer)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.email}</div>
                        {customer.phone && <div className="text-xs text-muted-foreground">{formatPhoneNumber(customer.phone)}</div>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicle_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input
                  value={formData.vehicle_number}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicle_number: e.target.value })
                  }
                  placeholder="Enter vehicle number"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pickup Location</Label>
                <Input
                  value={formData.pickup_location}
                  onChange={(e) =>
                    setFormData({ ...formData, pickup_location: e.target.value })
                  }
                  placeholder="Enter pickup location"
                />
              </div>
              <div className="space-y-2">
                <Label>Drop Location</Label>
                <Input
                  value={formData.drop_location}
                  onChange={(e) =>
                    setFormData({ ...formData, drop_location: e.target.value })
                  }
                  placeholder="Enter drop location"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pickup Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.pickup_date ? (
                        format(formData.pickup_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.pickup_date}
                      onSelect={(date) => date && setFormData({ ...formData, pickup_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Pickup Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {formData.pickup_time ? formData.pickup_time : "Select time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-0">
                    <div className="p-3 space-y-3">
                      <Label>Select time</Label>
                      <Select
                        value={formData.pickup_time}
                        onValueChange={(value) => setFormData({ ...formData, pickup_time: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, hour) => (
                            <>
                              <SelectItem key={`${hour}:00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                                {hour.toString().padStart(2, '0')}:00
                              </SelectItem>
                              <SelectItem key={`${hour}:30`} value={`${hour.toString().padStart(2, '0')}:30`}>
                                {hour.toString().padStart(2, '0')}:30
                              </SelectItem>
                            </>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input
                  value={formData.driver_name}
                  onChange={(e) =>
                    setFormData({ ...formData, driver_name: e.target.value })
                  }
                  placeholder="Enter driver name"
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Contact</Label>
                <Input
                  value={formData.driver_contact}
                  onChange={(e) =>
                    setFormData({ ...formData, driver_contact: e.target.value })
                  }
                  placeholder="Enter driver contact"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Enter any additional notes"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
              <Button 
                type="button" 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSaveAndShareWhatsApp}
                disabled={isLoadingCustomers || !selectedCustomer}
              >
                <Share2 className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Share on WhatsApp</span>
                <span className="xs:hidden">WhatsApp</span>
              </Button>
              <Button 
                type="button" 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSaveAndDownloadPDF}
                disabled={isLoadingCustomers || !selectedCustomer}
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Download PDF</span>
                <span className="xs:hidden">PDF</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Transfer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="p-4 sm:p-6 w-[95vw] sm:max-w-[600px] bg-background sm:rounded-lg gap-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
          </DialogHeader>
          {viewTransfer && (
            <div className="space-y-5">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b">
                  <h3 className="text-lg font-medium">Customer Information</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="font-medium">{viewTransfer.customers?.name}</p>
                      <p className="text-sm text-muted-foreground">{viewTransfer.customers?.email}</p>
                      <p className="text-sm text-muted-foreground">{viewTransfer.customers?.phone ? formatPhoneNumber(viewTransfer.customers.phone) : "No phone"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b">
                  <h3 className="text-lg font-medium">Transfer Details</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle Type</p>
                      <p>{viewTransfer.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle Number</p>
                      <p>{viewTransfer.vehicle_number}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup Location</p>
                    <p>{viewTransfer.pickup_location}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Drop Location</p>
                    <p>{viewTransfer.drop_location}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup Date & Time</p>
                    <p>{format(new Date(viewTransfer.pickup_datetime), "PPpp")}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Driver Name</p>
                      <p>{viewTransfer.driver_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Driver Contact</p>
                      <p>{formatPhoneNumber(viewTransfer.driver_contact)}</p>
                    </div>
                  </div>
                  
                  {viewTransfer.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p>{viewTransfer.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => handleDownloadTransferPDF(viewTransfer)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden xs:inline">Download</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => shareTransferViaEmail(viewTransfer)}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden xs:inline">Send Email</span>
                  <span className="xs:hidden">Email</span>
                </Button>
                <Button 
                  onClick={() => handleShareTransfer(viewTransfer)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden xs:inline">Share</span>
                  <span className="xs:hidden">WhatsApp</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
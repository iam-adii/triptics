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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Loader2, MoreHorizontal, Pencil, Trash2, CalendarRange, ArrowUpDown, ArrowUp, ArrowDown, Eye, UserPlus, Users } from "lucide-react";
import { FormDialog } from "@/components/ui/form-dialog";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define customer type for better type safety
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  total_bookings: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
  adults?: number;
  children?: number;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [customerBookings, setCustomerBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [bookingFilter, setBookingFilter] = useState("all");
  const itemsPerPage = 10;
  
  // Use debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchQuery, 500);

  // Fetch customers on component mount or when filters change
  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearchTerm, currentPage, sortBy, sortOrder, bookingFilter]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      // First, get the total count for pagination
      let countQuery = supabase.from("customers").select("id", { count: "exact" });
      
      if (debouncedSearchTerm) {
        countQuery = countQuery.or(`name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`);
      }
      
      // Apply booking filter if selected
      if (bookingFilter === "with_bookings") {
        countQuery = countQuery.gt("total_bookings", 0);
      } else if (bookingFilter === "no_bookings") {
        countQuery = countQuery.eq("total_bookings", 0);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      const total = count || 0;
      setTotalCount(total);
      setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
      
      // Adjust current page if it exceeds the total pages
      if (currentPage > Math.max(1, Math.ceil(total / itemsPerPage)) && total > 0) {
        setCurrentPage(1);
        return; // This will trigger a re-fetch with the correct page
      }
      
      // Then fetch the actual data with pagination
      let query = supabase
        .from("customers")
        .select("*");
      
      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`);
      }
      
      // Apply booking filter if selected
      if (bookingFilter === "with_bookings") {
        query = query.gt("total_bookings", 0);
      } else if (bookingFilter === "no_bookings") {
        query = query.eq("total_bookings", 0);
      }
      
      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      // Apply sorting
      const { data, error } = await query
        .order(sortBy, { ascending: sortOrder === "asc" })
        .range(from, to);
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewOpen(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer? This will also delete all related bookings and payments.")) {
      try {
        const { error } = await supabase.from("customers").delete().eq("id", id);
        if (error) throw error;
        
        toast.success("Customer deleted successfully");
        fetchCustomers(); // Refresh the list after deletion
      } catch (error) {
        console.error("Error deleting customer:", error);
        toast.error("Failed to delete customer");
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchCustomers();
  };

  // Handle sorting change
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setBookingFilter("all");
    setSortBy("created_at");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Format currency with locale
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  // Handle viewing customer bookings
  const handleViewBookings = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingBookings(true);
    setIsBookingsOpen(true);
    
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          start_date,
          end_date,
          status,
          total_amount,
          tours (id, name, location)
        `)
        .eq("customer_id", customer.id)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      setCustomerBookings(data || []);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      toast.error("Failed to load customer bookings");
      setCustomerBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer base and their booking history.
          </p>
        </div>
        <Button 
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600" 
          onClick={handleAddCustomer}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search customers..." 
            className="pl-10 bg-white dark:bg-gray-950 w-full" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Select 
            value={bookingFilter}
            onValueChange={(value) => {
              setBookingFilter(value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-950">
              <SelectValue placeholder="Booking Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="with_bookings">With Bookings</SelectItem>
              <SelectItem value="no_bookings">No Bookings</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={sortBy}
            onValueChange={(value) => {
              handleSortChange(value);
            }}
          >
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-950">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="total_bookings">Total Bookings</SelectItem>
              <SelectItem value="total_spent">Total Spent</SelectItem>
              <SelectItem value="created_at">Date Added</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" onClick={handleClearFilters} className="hidden sm:flex">
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSortChange("name")}
                >
                  Customer
                  {sortBy === "name" && (
                    sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                  )}
                  {sortBy !== "name" && <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />}
                </div>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSortChange("total_bookings")}
                >
                  Total Bookings
                  {sortBy === "total_bookings" && (
                    sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                  )}
                  {sortBy !== "total_bookings" && <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSortChange("total_spent")}
                >
                  Total Spent
                  {sortBy === "total_spent" && (
                    sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                  )}
                  {sortBy !== "total_spent" && <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mr-2" />
                    <span>Loading customers...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No customers found. Try adjusting your search or add a new customer.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {customer.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>{customer.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || "—"}</TableCell>
                  <TableCell>{customer.total_bookings}</TableCell>
                  <TableCell>{formatCurrency(customer.total_spent)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCustomer(customer)}
                        className="h-8 w-8 p-0"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="View Bookings"
                        onClick={() => handleViewBookings(customer)}
                      >
                        <CalendarRange className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem 
                            onClick={() => handleEditCustomer(customer)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="cursor-pointer text-red-600 focus:text-red-600"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground order-2 sm:order-1">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} customer(s)
        </p>
        
        {totalPages > 1 && (
          <Pagination className="order-1 sm:order-2">
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
      </div>

      <FormDialog
        title={selectedCustomer ? "Edit Customer" : "Add New Customer"}
        description={
          selectedCustomer
            ? "Edit customer information."
            : "Add a new customer to your database."
        }
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      >
        <CustomerForm
          customer={selectedCustomer}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      </FormDialog>

      {/* Customer Details Dialog */}
      <FormDialog
        title="Customer Details"
        description="Detailed information about the customer."
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
      >
        <div className="space-y-6">
          {selectedCustomer && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                  <p className="mt-1">{selectedCustomer.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p className="mt-1">{selectedCustomer.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                  <p className="mt-1">{selectedCustomer.phone || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Total Bookings</h4>
                  <p className="mt-1">{selectedCustomer.total_bookings}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Total Spent</h4>
                  <p className="mt-1">{formatCurrency(selectedCustomer.total_spent)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                  <p className="mt-1">
                    {new Date(selectedCustomer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {/* Travel Group Details */}
              <div className="border p-4 rounded-md bg-gray-50 dark:bg-gray-900">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Travel Group Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground">Adults</h5>
                    <p className="mt-1">{selectedCustomer.adults || 0}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground">Children</h5>
                    <p className="mt-1">{selectedCustomer.children || 0}</p>
                  </div>
                  <div className="sm:col-span-2 text-xs text-muted-foreground">
                    Total travelers: {(selectedCustomer.adults || 0) + (selectedCustomer.children || 0)}
                  </div>
                </div>
              </div>
              
              {selectedCustomer.address && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
                  <p className="mt-1 text-sm">{selectedCustomer.address}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => handleViewBookings(selectedCustomer)}
                >
                  View Bookings
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleEditCustomer(selectedCustomer)}
                >
                  Edit Customer
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => setIsViewOpen(false)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </FormDialog>

      <FormDialog
        title={`${selectedCustomer?.name}'s Bookings`}
        description="View all bookings for this customer."
        isOpen={isBookingsOpen}
        onClose={() => setIsBookingsOpen(false)}
      >
        <div className="space-y-4">
          {loadingBookings ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mr-2" />
              <span>Loading bookings...</span>
            </div>
          ) : customerBookings.length === 0 ? (
            <div className="text-center py-8">
              <p>No bookings found for this customer.</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tour</TableHead>
                      <TableHead>Travel Dates</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.tours?.name || "Unknown Tour"}</TableCell>
                        <TableCell>
                          {booking.start_date && booking.end_date ? (
                            `${new Date(booking.start_date).toLocaleDateString()} - ${new Date(booking.end_date).toLocaleDateString()}`
                          ) : "No dates"}
                        </TableCell>
                        <TableCell>{formatCurrency(booking.total_amount)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === "Confirmed"
                                ? "bg-green-500/20 text-green-500"
                                : booking.status === "Pending"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : booking.status === "Cancelled"
                                ? "bg-red-500/20 text-red-500"
                                : booking.status === "In Progress"
                                ? "bg-blue-500/20 text-blue-500"
                                : booking.status === "Completed"
                                ? "bg-emerald-500/20 text-emerald-500"
                                : "bg-purple-500/20 text-purple-500"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => setIsBookingsOpen(false)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </FormDialog>
    </div>
  );
}

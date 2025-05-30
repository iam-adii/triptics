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
import { Search, Loader2, Eye, MoreHorizontal, Pencil, Trash2, UserPlus, Calendar } from "lucide-react";
import { FormDialog } from "@/components/ui/form-dialog";
import { LeadForm } from "@/components/forms/LeadForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/useDebounce";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  
  // Use debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchQuery, 500);

  // Fetch leads on component mount or when filters change
  useEffect(() => {
    fetchLeads();
  }, [statusFilter, sourceFilter, dateFilter, debouncedSearchTerm, currentPage]);

  async function fetchLeads() {
    setLoading(true);
    try {
      // First, get the total count for pagination
      let countQuery = supabase.from("leads").select("id", { count: "exact" });
      
      if (statusFilter !== "all") {
        countQuery = countQuery.eq("status", statusFilter);
      }
      
      if (sourceFilter !== "all") {
        countQuery = countQuery.eq("source", sourceFilter);
      }
      
      // Apply date filter
      if (dateFilter !== "all") {
        let dateRange;
        const now = new Date();
        
        switch (dateFilter) {
          case "today":
            dateRange = {
              start: startOfDay(now).toISOString(),
              end: endOfDay(now).toISOString()
            };
            break;
          case "yesterday":
            dateRange = {
              start: startOfDay(subDays(now, 1)).toISOString(),
              end: endOfDay(subDays(now, 1)).toISOString()
            };
            break;
          case "last7days":
            dateRange = {
              start: startOfDay(subDays(now, 7)).toISOString(),
              end: endOfDay(now).toISOString()
            };
            break;
          case "last30days":
            dateRange = {
              start: startOfDay(subDays(now, 30)).toISOString(),
              end: endOfDay(now).toISOString()
            };
            break;
        }
        
        if (dateRange) {
          countQuery = countQuery.gte("created_at", dateRange.start).lte("created_at", dateRange.end);
        }
      }
      
      if (debouncedSearchTerm) {
        countQuery = countQuery.or(`name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`);
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
        .from("leads")
        .select("*");
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      if (sourceFilter !== "all") {
        query = query.eq("source", sourceFilter);
      }
      
      // Apply date filter to the main query
      if (dateFilter !== "all") {
        let dateRange;
        const now = new Date();
        
        switch (dateFilter) {
          case "today":
            dateRange = {
              start: startOfDay(now).toISOString(),
              end: endOfDay(now).toISOString()
            };
            break;
          case "yesterday":
            dateRange = {
              start: startOfDay(subDays(now, 1)).toISOString(),
              end: endOfDay(subDays(now, 1)).toISOString()
            };
            break;
          case "last7days":
            dateRange = {
              start: startOfDay(subDays(now, 7)).toISOString(),
              end: endOfDay(now).toISOString()
            };
            break;
          case "last30days":
            dateRange = {
              start: startOfDay(subDays(now, 30)).toISOString(),
              end: endOfDay(now).toISOString()
            };
            break;
        }
        
        if (dateRange) {
          query = query.gte("created_at", dateRange.start).lte("created_at", dateRange.end);
        }
      }
      
      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`);
      }
      
      // Apply pagination after all filters
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddLead = () => {
    setSelectedLead(null);
    setIsFormOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsFormOpen(true);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      try {
        const { error } = await supabase.from("leads").delete().eq("id", id);
        if (error) throw error;
        
        toast.success("Lead deleted successfully");
        fetchLeads(); // Refresh the list after deletion
      } catch (error) {
        console.error("Error deleting lead:", error);
        toast.error("Failed to delete lead");
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchLeads();
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (error) throw error;
      
      // Update the selected lead in state
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({
          ...selectedLead,
          status: newStatus,
          updated_at: new Date().toISOString(),
        });
      }
      
      toast.success(`Lead status updated to ${newStatus}`);
      fetchLeads(); // Refresh the list to reflect changes
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("Failed to update lead status");
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

  // Add a function to clear all filters
  const handleClearFilters = () => {
    setStatusFilter("all");
    setSourceFilter("all");
    setDateFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your leads through the sales pipeline.
          </p>
        </div>
        <Button 
          size="default" 
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white"
          onClick={handleAddLead}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search leads..." 
            className="pl-10 bg-white dark:bg-gray-950 w-full" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select 
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1); // Reset to first page on filter change
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-gray-950">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Qualified">Qualified</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={sourceFilter}
          onValueChange={(value) => {
            setSourceFilter(value);
            setCurrentPage(1); // Reset to first page on filter change
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-gray-950">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Website">Website</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
            <SelectItem value="Social Media">Social Media</SelectItem>
            <SelectItem value="Advertisement">Advertisement</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={dateFilter}
          onValueChange={(value) => {
            setDateFilter(value);
            setCurrentPage(1); // Reset to first page on filter change
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-gray-950">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Dates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7days">Last 7 Days</SelectItem>
            <SelectItem value="last30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="ghost" onClick={handleClearFilters} className="hidden sm:flex">
          Clear Filters
        </Button>
      </div>

      <div className="border rounded-lg bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mr-2" />
                    <span>Loading leads...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No leads found. Try adjusting your filters or add a new lead.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <TableCell>{lead.name || "Unknown"}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phone || "—"}</TableCell>
                  <TableCell>{lead.source || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === "New"
                          ? "bg-blue-100 text-blue-700"
                          : lead.status === "Contacted"
                          ? "bg-purple-100 text-purple-700"
                          : lead.status === "Qualified" 
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell>{lead.created_at ? format(new Date(lead.created_at), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewLead(lead)}
                        className="h-8 w-8 p-0"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
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
                            onClick={() => handleEditLead(lead)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteLead(lead.id)}
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
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} lead(s)
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

      {/* Lead Form Dialog */}
      <FormDialog
        title={selectedLead ? "Edit Lead" : "Add New Lead"}
        description={
          selectedLead
            ? "Edit lead information and update their status."
            : "Add a new lead to your pipeline."
        }
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      >
        <div className="sm:max-w-[600px]">
          <LeadForm
            lead={selectedLead}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      </FormDialog>

      {/* Lead Details Dialog */}
      <FormDialog
        title="Lead Details"
        description="Detailed information about the lead."
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
      >
        <div className="space-y-6">
          {selectedLead && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                  <p className="mt-1">{selectedLead.name || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p className="mt-1">{selectedLead.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                  <p className="mt-1">{selectedLead.phone || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Source</h4>
                  <p className="mt-1">{selectedLead.source || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <div className="mt-2">
                    <Select
                      defaultValue={selectedLead.status}
                      onValueChange={(value) => handleStatusChange(selectedLead.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                            New
                          </div>
                        </SelectItem>
                        <SelectItem value="Contacted">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-purple-500 mr-2" />
                            Contacted
                          </div>
                        </SelectItem>
                        <SelectItem value="Qualified">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                            Qualified
                          </div>
                        </SelectItem>
                        <SelectItem value="Lost">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                            Lost
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                  <p className="mt-1">
                    {format(new Date(selectedLead.created_at), "PPP")}
                  </p>
                </div>
              </div>
              
              {selectedLead.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                  <p className="mt-1 text-sm">{selectedLead.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => handleEditLead(selectedLead)}
                >
                  Edit Lead
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
    </div>
  );
} 
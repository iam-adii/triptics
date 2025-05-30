import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Itinerary } from "@/types/itinerary";
import { 
  fetchItineraries, 
  deleteItinerary, 
  updateItineraryStatus 
} from "@/services/itineraryService";

export function useItineraryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [destination, setDestination] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [tab, setTab] = useState('all');
  
  const queryClient = useQueryClient();

  // Fetch itineraries using React Query
  const { 
    data: itineraries = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["itineraries"],
    queryFn: fetchItineraries
  });

  // Delete itinerary mutation
  const deleteItineraryMutation = useMutation({
    mutationFn: deleteItinerary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      toast.success("Itinerary deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting itinerary:", error);
      toast.error("Failed to delete itinerary");
    }
  });

  // Update itinerary status mutation
  const updateStatusMutation = useMutation({
    mutationFn: updateItineraryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      toast.success("Status updated successfully");
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  });

  const handleEditItinerary = (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary);
    setIsFormOpen(true);
  };

  const handleCreateItinerary = () => {
    setSelectedItinerary(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedItinerary(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["itineraries"] });
    setIsFormOpen(false);
    setSelectedItinerary(null);
  };

  const handleDeleteItinerary = (id: string) => {
    if (window.confirm("Are you sure you want to delete this itinerary?")) {
      deleteItineraryMutation.mutate(id);
    }
  };

  const handlePublish = (id: string) => {
    updateStatusMutation.mutate({ id, status: "Published" });
  };

  const handleArchive = (id: string) => {
    updateStatusMutation.mutate({ id, status: "Archived" });
  };

  const handleShareViaWhatsApp = (itinerary: Itinerary) => {
    const message = `Check out this travel itinerary: ${itinerary.name} - ${itinerary.destination || ''}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter itineraries based on search term, status, and date
  const filteredItineraries = itineraries.filter((itinerary) => {
    const matchesSearch = 
      itinerary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (itinerary.destination && itinerary.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (itinerary.customers?.name && itinerary.customers.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === "all" || 
      itinerary.status.toLowerCase() === statusFilter.toLowerCase();

    // Filter by destination if selected
    const matchesDestination =
      destination === "all" ||
      (itinerary.destination && itinerary.destination.toLowerCase() === destination.toLowerCase());

    // Date filtering
    let matchesDate = true;
    const today = new Date();
    const startDate = itinerary.start_date ? new Date(itinerary.start_date) : null;
    
    if (dateFilter === "upcoming" && startDate) {
      matchesDate = startDate > today;
    } else if (dateFilter === "past" && startDate) {
      matchesDate = startDate < today;
    } else if (dateFilter === "thisMonth" && startDate) {
      matchesDate = 
        startDate.getMonth() === today.getMonth() &&
        startDate.getFullYear() === today.getFullYear();
    } else if (dateFilter === "nextMonth" && startDate) {
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      matchesDate = 
        startDate.getMonth() === nextMonth.getMonth() &&
        startDate.getFullYear() === nextMonth.getFullYear();
    }

    return matchesSearch && matchesStatus && matchesDate && matchesDestination;
  });

  // Helper to get filtered itineraries by tab
  const getTabFilteredItineraries = (tabValue: string) => {
    if (tabValue === 'all') return filteredItineraries;
    if (tabValue === 'drafts') return filteredItineraries.filter(i => i.status.toLowerCase() === 'draft');
    if (tabValue === 'published') return filteredItineraries.filter(i => i.status.toLowerCase() === 'published');
    if (tabValue === 'templates') return []; // Adjust if you have template logic
    return filteredItineraries;
  };

  // Get paginated data for the current tab
  const tabFilteredItineraries = getTabFilteredItineraries(tab);
  const totalTabCount = tabFilteredItineraries.length;
  const totalTabPages = Math.max(1, Math.ceil(totalTabCount / itemsPerPage));
  const paginatedTabItineraries = tabFilteredItineraries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Extract unique destinations for the filter
  const destinations = [...new Set(itineraries
    .map(itinerary => itinerary.destination)
    .filter(Boolean)
  )];

  // Update getPaginationItems to use totalTabPages
  const getPaginationItems = () => {
    const items = [];
    items.push(1);
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalTabPages - 1, currentPage + 1);
    if (startPage > 2) items.push('...');
    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalTabPages) items.push(i);
    }
    if (endPage < totalTabPages - 1) items.push('...');
    if (totalTabPages > 1) items.push(totalTabPages);
    return items;
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    destination,
    setDestination,
    isFormOpen,
    selectedItinerary,
    itineraries,
    filteredItineraries,
    paginatedTabItineraries,
    destinations,
    isLoading,
    error,
    currentPage,
    totalTabPages,
    totalTabCount,
    itemsPerPage,
    handlePageChange,
    getPaginationItems,
    handleEditItinerary,
    handleCreateItinerary,
    handleCloseForm,
    handleFormSuccess,
    handleDeleteItinerary,
    handlePublish,
    handleArchive,
    handleShareViaWhatsApp,
    tab,
    setTab
  };
}

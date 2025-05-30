import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormDialog } from "@/components/ui/form-dialog";
import { ItineraryForm } from "@/components/forms/ItineraryForm";
import { ItineraryFilters } from "@/components/itinerary/ItineraryFilters";
import { ItineraryList } from "@/components/itinerary/ItineraryList";
import { useItineraryManagement } from "@/hooks/useItineraryManagement";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function Itineraries() {
  const navigate = useNavigate();
  
  const {
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
    paginatedTabItineraries,
    filteredItineraries,
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
  } = useItineraryManagement();

  // Function to handle saving form and opening builder directly
  const handleSaveAndOpenBuilder = async (itineraryId: string) => {
    try {
      // Fetch the itinerary by ID
      const { data, error } = await supabase
        .from("itineraries")
        .select("*, customers(*)")
        .eq("id", itineraryId)
        .single();

      if (error) throw error;

      // Close the form dialog
      handleFormSuccess();
      
      // Navigate to the builder page
      if (data) {
        navigate(`/itineraries/builder/${itineraryId}`);
      }
    } catch (error) {
      console.error("Error fetching itinerary:", error);
    }
  };

  // Function to navigate to the builder page
  const handleOpenBuilder = (itinerary: any) => {
    navigate(`/itineraries/builder/${itinerary.id}`);
  };

  // Function to render pagination UI
  const renderPagination = (filteredList: any[]) => {
    const listCount = filteredList.length;
    const listPages = Math.max(1, Math.ceil(listCount / itemsPerPage));
    
    if (listPages <= 1) return null;
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
        <p className="text-sm text-muted-foreground order-2 sm:order-1">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, listCount)} - {Math.min(currentPage * itemsPerPage, listCount)} of {listCount} itineraries
        </p>
        
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
            
            {getPaginationItems().map((item, index) => (
              item === '...' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${item}`}>
                  <PaginationLink 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(item as number);
                    }}
                    isActive={currentPage === item}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < listPages) handlePageChange(currentPage + 1);
                }}
                className={currentPage === listPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading itineraries</h2>
          <p className="text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Itinerary Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage detailed travel itineraries for your clients.
          </p>
        </div>
        <Button 
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 h-11 sm:h-10" 
          onClick={handleCreateItinerary}
        >
          <Plus className="mr-2 h-4 w-4" /> Create Itinerary
        </Button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Manage Itineraries</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            View, edit, and share detailed travel itineraries for your clients.
          </p>
        </div>

        <ItineraryFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          destination={destination}
          onDestinationChange={setDestination}
          destinations={destinations}
        />

        <Tabs value={tab} onValueChange={(val) => { setTab(val); handlePageChange(1); }} className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-4 mb-8">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white h-10 sm:h-9 text-xs sm:text-sm"
            >
              All Itineraries
            </TabsTrigger>
            <TabsTrigger 
              value="drafts" 
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white h-10 sm:h-9 text-xs sm:text-sm"
            >
              Drafts
            </TabsTrigger>
            <TabsTrigger 
              value="published" 
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white h-10 sm:h-9 text-xs sm:text-sm"
            >
              Published
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white h-10 sm:h-9 text-xs sm:text-sm"
            >
              Templates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <ItineraryList 
              itineraries={paginatedTabItineraries}
              isLoading={isLoading}
              onOpenBuilder={handleOpenBuilder}
              onEditItinerary={handleEditItinerary}
              onPublish={handlePublish}
              onArchive={handleArchive}
              onDelete={handleDeleteItinerary}
              onShare={handleShareViaWhatsApp}
            />
            {renderPagination(filteredItineraries)}
          </TabsContent>
          
          <TabsContent value="drafts" className="mt-0">
            <ItineraryList 
              itineraries={paginatedTabItineraries}
              isLoading={isLoading}
              onOpenBuilder={handleOpenBuilder}
              onEditItinerary={handleEditItinerary}
              onPublish={handlePublish}
              onArchive={handleArchive}
              onDelete={handleDeleteItinerary}
              onShare={handleShareViaWhatsApp}
            />
            {renderPagination(filteredItineraries)}
          </TabsContent>
          
          <TabsContent value="published" className="mt-0">
            <ItineraryList 
              itineraries={paginatedTabItineraries}
              isLoading={isLoading}
              onOpenBuilder={handleOpenBuilder}
              onEditItinerary={handleEditItinerary}
              onPublish={handlePublish}
              onArchive={handleArchive}
              onDelete={handleDeleteItinerary}
              onShare={handleShareViaWhatsApp}
            />
            {renderPagination(filteredItineraries)}
          </TabsContent>
          
          <TabsContent value="templates" className="mt-0">
            <div className="border rounded-md p-6 sm:p-8 text-center">
              <p className="text-muted-foreground">No templates found. Create a template from an existing itinerary.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Itinerary Form Dialog */}
      <FormDialog
        title={selectedItinerary ? "Edit Itinerary" : "Create New Itinerary"}
        description={selectedItinerary ? "Edit the itinerary details below." : "Fill out the form below to create a new itinerary."}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
      >
        <ItineraryForm 
          itinerary={selectedItinerary} 
          onSuccess={handleFormSuccess} 
          onCancel={handleCloseForm}
          onOpenBuilder={handleSaveAndOpenBuilder}
        />
      </FormDialog>
    </div>
  );
}

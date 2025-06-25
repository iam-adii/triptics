import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/components/PageLoader";
import { Plus, Edit, Trash2, MoreHorizontal, Search, X } from 'lucide-react';

// Define interfaces for our data types
interface TransferRoute {
  id: string;
  name: string;
  description: string;
  cab_types: TransferCabType[];
}

interface TransferCabType {
  id: string;
  name: string;
  price: number;
  route_id: string;
  season_name?: string;
  season_start?: string;
  season_end?: string;
}

export default function TransferRoutes() {
  const queryClient = useQueryClient();
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [transferRoutes, setTransferRoutes] = useState<TransferRoute[]>([]);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isCabTypeDialogOpen, setIsCabTypeDialogOpen] = useState(false);
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [isSavingCabType, setIsSavingCabType] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<TransferRoute | null>(null);
  
  // Form state for new/edit route
  const [newRoute, setNewRoute] = useState<{
    id?: string;
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  
  // Form state for new/edit cab type
  const [newCabType, setNewCabType] = useState<{
    id?: string;
    name: string;
    price: number;
    route_id?: string;
    season_name?: string;
    season_start?: string;
    season_end?: string;
  }>({
    name: "",
    price: 0,
    season_name: "",
    season_start: "",
    season_end: "",
  });

  // Fetch transfer routes
  const fetchTransferRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      // Fetch routes from Supabase
      const { data: routes, error: routesError } = await supabase
        .from("transfer_routes")
        .select("*")
        .order("name");
      
      if (routesError) throw routesError;
      
      // Fetch cab types for each route
      const routesWithCabTypes = await Promise.all(
        (routes || []).map(async (route) => {
          const { data: cabTypes, error: cabTypesError } = await supabase
            .from("transfer_cab_types")
            .select("*")
            .eq("route_id", route.id)
            .order("name");
          
          if (cabTypesError) throw cabTypesError;
          
          return {
            ...route,
            cab_types: cabTypes || [],
          };
        })
      );
      
      setTransferRoutes(routesWithCabTypes);
    } catch (error: any) {
      console.error("Error fetching transfer routes:", error);
      toast.error("Failed to load transfer routes");
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTransferRoutes();
  }, []);

  // Add or update a transfer route
  const handleSaveRoute = async () => {
    setIsSavingRoute(true);
    try {
      if (!newRoute.name.trim()) {
        toast.error("Route name is required");
        return;
      }
      
      let routeId = newRoute.id;
      
      if (isEditMode && routeId) {
        // Update existing route
        const { error } = await supabase
          .from("transfer_routes")
          .update({
            name: newRoute.name,
            description: newRoute.description,
          })
          .eq("id", routeId);
        
        if (error) throw error;
        
        toast.success("Route updated successfully");
      } else {
        // Add new route
        const { data, error } = await supabase
          .from("transfer_routes")
          .insert({
            name: newRoute.name,
            description: newRoute.description,
          })
          .select();
        
        if (error) throw error;
        
        routeId = data[0].id;
        toast.success("Route added successfully");
      }
      
      // Reset form and close dialog
      setNewRoute({
        name: "",
        description: "",
      });
      setIsRouteDialogOpen(false);
      setIsEditMode(false);
      
      // Refresh routes
      fetchTransferRoutes();
    } catch (error: any) {
      console.error("Error saving route:", error);
      toast.error("Failed to save route: " + error.message);
    } finally {
      setIsSavingRoute(false);
    }
  };
  
  // Delete a transfer route
  const handleDeleteRoute = async (routeId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this route? This will also delete all associated cab types."
    );
    
    if (!confirmed) return;
    
    try {
      // Delete cab types first (cascade delete would be better if available)
      const { error: cabTypesError } = await supabase
        .from("transfer_cab_types")
        .delete()
        .eq("route_id", routeId);
      
      if (cabTypesError) throw cabTypesError;
      
      // Delete route
      const { error } = await supabase
        .from("transfer_routes")
        .delete()
        .eq("id", routeId);
      
      if (error) throw error;
      
      toast.success("Route deleted successfully");
      
      // Refresh routes
      fetchTransferRoutes();
    } catch (error: any) {
      console.error("Error deleting route:", error);
      toast.error("Failed to delete route: " + error.message);
    }
  };
  
  // Add or update a cab type
  const handleSaveCabType = async () => {
    setIsSavingCabType(true);
    try {
      if (!newCabType.name.trim()) {
        toast.error("Cab type name is required");
        return;
      }
      
      if (!newCabType.route_id) {
        toast.error("Please select a route");
        return;
      }
      
      if (isEditMode && newCabType.id) {
        // Update existing cab type
        const { error } = await supabase
          .from("transfer_cab_types")
          .update({
            name: newCabType.name,
            price: newCabType.price,
            route_id: newCabType.route_id,
            season_name: newCabType.season_name,
            season_start: newCabType.season_start,
            season_end: newCabType.season_end,
          })
          .eq("id", newCabType.id);
        
        if (error) throw error;
        
        toast.success("Cab type updated successfully");
      } else {
        // Add new cab type
        const { error } = await supabase
          .from("transfer_cab_types")
          .insert({
            name: newCabType.name,
            price: newCabType.price,
            route_id: newCabType.route_id,
            season_name: newCabType.season_name,
            season_start: newCabType.season_start,
            season_end: newCabType.season_end,
          });
        
        if (error) throw error;
        
        toast.success("Cab type added successfully");
      }
      
      // Reset form and close dialog
      setNewCabType({
        name: "",
        price: 0,
        season_name: "",
        season_start: "",
        season_end: "",
      });
      setIsCabTypeDialogOpen(false);
      setIsEditMode(false);
      
      // Refresh routes
      fetchTransferRoutes();
    } catch (error: any) {
      console.error("Error saving cab type:", error);
      toast.error("Failed to save cab type: " + error.message);
    } finally {
      setIsSavingCabType(false);
    }
  };
  
  // Delete a cab type
  const handleDeleteCabType = async (cabTypeId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this cab type?"
    );
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from("transfer_cab_types")
        .delete()
        .eq("id", cabTypeId);
      
      if (error) throw error;
      
      toast.success("Cab type deleted successfully");
      
      // Refresh routes
      fetchTransferRoutes();
    } catch (error: any) {
      console.error("Error deleting cab type:", error);
      toast.error("Failed to delete cab type: " + error.message);
    }
  };

  // Filter routes based on search text
  const filteredRoutes = transferRoutes.filter(route => 
    route.name.toLowerCase().includes(searchText.toLowerCase()) ||
    route.description.toLowerCase().includes(searchText.toLowerCase())
  );

  // Helper function to group cab types by season
  const getGroupedCabTypes = (cabTypes: TransferCabType[]) => {
    // First separate standard (no season) from seasonal cab types
    const standard: TransferCabType[] = [];
    const seasonal: TransferCabType[] = [];
    
    cabTypes.forEach(cabType => {
      if (cabType.season_name) {
        seasonal.push(cabType);
      } else {
        standard.push(cabType);
      }
    });
    
    // Sort seasonal cab types by season name
    seasonal.sort((a, b) => {
      return (a.season_name || "").localeCompare(b.season_name || "");
    });
    
    // Return with standard rates first, then seasonal
    return [...standard, ...seasonal];
  };

  // Function to group cab types by season for display
  const renderCabTypesByGroup = (cabTypes: TransferCabType[]) => {
    const groupedCabTypes = getGroupedCabTypes(cabTypes);
    
    // Keep track of current season group
    let currentSeasonName: string | undefined = undefined;
    
    return groupedCabTypes.map((cabType, index) => {
      // Check if this is the start of a new season group
      const isNewSeasonGroup = cabType.season_name !== currentSeasonName;
      
      // Update current season name
      currentSeasonName = cabType.season_name;
      
      return (
        <React.Fragment key={cabType.id}>
          {/* Add visual separator between season groups */}
          {isNewSeasonGroup && index > 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-1 px-0">
                <div className="border-t border-dashed my-1"></div>
              </TableCell>
            </TableRow>
          )}
          <TableRow className={cabType.season_name ? "bg-muted/20" : ""}>
            <TableCell>{cabType.name}</TableCell>
            <TableCell className="text-right font-medium">₹{cabType.price.toFixed(2)}</TableCell>
            <TableCell>
              {cabType.season_name ? (
                <div>
                  <span className="font-medium">{cabType.season_name}</span>
                  {(cabType.season_start || cabType.season_end) && (
                    <div className="text-xs text-muted-foreground">
                      {cabType.season_start || "Any"} to {cabType.season_end || "Any"}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Standard</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setNewCabType({
                      id: cabType.id,
                      name: cabType.name,
                      price: cabType.price,
                      route_id: cabType.route_id,
                      season_name: cabType.season_name,
                      season_start: cabType.season_start,
                      season_end: cabType.season_end,
                    });
                    setIsEditMode(true);
                    setIsCabTypeDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteCabType(cabType.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </React.Fragment>
      );
    });
  };

  // Helper function to check if a route has any seasonal rates
  const hasSeasonalRates = (route: TransferRoute) => {
    return route.cab_types.some(cabType => cabType.season_name);
  };

  if (isLoadingRoutes) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transfer Routes</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage transfer routes and cab types for your itineraries.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setNewRoute({ name: "", description: "" });
                  setIsEditMode(false);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Route
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold">
                  {isEditMode ? "Edit Route" : "Add New Route"}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {isEditMode 
                    ? "Update the details for this transfer route." 
                    : "Create a new transfer route for your itineraries."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Route Information
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="route-name" className="text-sm font-medium">
                        Route Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="route-name"
                        placeholder="e.g., Delhi to Agra, Mumbai to Pune"
                        value={newRoute.name}
                        onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use a clear, descriptive name for the route
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="route-description" className="text-sm font-medium">
                        Description <span className="text-muted-foreground">(Optional)</span>
                      </Label>
                      <Textarea
                        id="route-description"
                        placeholder="Describe the route, important landmarks, distance, or any special notes..."
                        value={newRoute.description}
                        onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })}
                        rows={4}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Add details that will help identify or understand this route
                      </p>
                    </div>
                  </div>
                  
                  {/* Preview Section */}
                  {newRoute.name && (
                    <div className="pt-4 border-t border-border">
                      <h5 className="text-sm font-medium text-muted-foreground mb-2">Preview</h5>
                      <div className="bg-muted/50 p-3 rounded-md space-y-1">
                        <div className="font-medium">{newRoute.name}</div>
                        {newRoute.description && (
                          <div className="text-sm text-muted-foreground">{newRoute.description}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-6 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => setIsRouteDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveRoute} 
                  disabled={isSavingRoute || !newRoute.name.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto"
                >
                  {isSavingRoute ? (
                    <>
                      <span className="mr-2">Saving...</span>
                      <span className="animate-spin">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    </>
                  ) : (
                    isEditMode ? "Update Route" : "Add Route"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCabTypeDialogOpen} onOpenChange={setIsCabTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setNewCabType({ name: "", price: 0, route_id: "", season_name: "", season_start: "", season_end: "" });
                  setIsEditMode(false);
                }}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Cab Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold">
                  {isEditMode ? "Edit Cab Type" : "Add New Cab Type"}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {isEditMode 
                    ? "Update the details for this cab type." 
                    : "Create a new cab type for a transfer route."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Basic Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="route-select" className="text-sm font-medium">
                        Select Route <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="route-select"
                        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newCabType.route_id || ""}
                        onChange={(e) => setNewCabType({ ...newCabType, route_id: e.target.value })}
                      >
                        <option value="" disabled>Select a route</option>
                        {transferRoutes.map((route) => (
                          <option key={route.id} value={route.id}>
                            {route.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cab-type-name" className="text-sm font-medium">
                        Cab Type Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cab-type-name"
                        placeholder="e.g., Innova, Tempo Traveller"
                        value={newCabType.name}
                        onChange={(e) => setNewCabType({ ...newCabType, name: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cab-type-price" className="text-sm font-medium">
                      Price (₹) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        id="cab-type-price"
                        type="number"
                        placeholder="0.00"
                        value={newCabType.price || ""}
                        onChange={(e) => setNewCabType({ ...newCabType, price: parseFloat(e.target.value) || 0 })}
                        className="pl-8 h-10"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Seasonal Pricing Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Seasonal Pricing (Optional)
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      Leave blank for standard pricing
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="season-name" className="text-sm font-medium">
                        Season Name
                      </Label>
                      <Input
                        id="season-name"
                        placeholder="e.g., Peak Season, Off Season, Festival Season"
                        value={newCabType.season_name || ""}
                        onChange={(e) => setNewCabType({ ...newCabType, season_name: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="season-start" className="text-sm font-medium">
                          Season Start Date
                        </Label>
                        <div className="relative">
                          <Input
                            id="season-start"
                            type="date"
                            value={newCabType.season_start || ""}
                            onChange={(e) => setNewCabType({ ...newCabType, season_start: e.target.value })}
                            className="h-10 cursor-pointer"
                            max={newCabType.season_end || undefined}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="season-end" className="text-sm font-medium">
                          Season End Date
                        </Label>
                        <div className="relative">
                          <Input
                            id="season-end"
                            type="date"
                            value={newCabType.season_end || ""}
                            onChange={(e) => setNewCabType({ ...newCabType, season_end: e.target.value })}
                            className="h-10 cursor-pointer"
                            min={newCabType.season_start || undefined}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {(newCabType.season_start || newCabType.season_end) && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                        <span className="font-medium">Season Duration:</span>{" "}
                        {newCabType.season_start 
                          ? new Date(newCabType.season_start).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short',
                              year: 'numeric'
                            })
                          : "Any date"
                        } to{" "}
                        {newCabType.season_end 
                          ? new Date(newCabType.season_end).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short',
                              year: 'numeric'
                            })
                          : "Any date"
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-6 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCabTypeDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveCabType} 
                  disabled={isSavingCabType || !newCabType.name.trim() || !newCabType.route_id}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto"
                >
                  {isSavingCabType ? (
                    <>
                      <span className="mr-2">Saving...</span>
                      <span className="animate-spin">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    </>
                  ) : (
                    isEditMode ? "Update Cab Type" : "Add Cab Type"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search routes..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>
        {searchText && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSearchText("")}
            className="h-10 w-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Routes</CardTitle>
          <CardDescription>
            All available transfer routes and their associated cab types
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRoutes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transfer routes found</p>
              {searchText && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search criteria
                </p>
              )}
              <Button 
                className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => {
                  setNewRoute({ name: "", description: "" });
                  setIsEditMode(false);
                  setIsRouteDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Your First Route
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRoutes.map((route) => (
                <div key={route.id} className="border rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center p-4 bg-muted/50">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {route.name}
                        {hasSeasonalRates(route) && (
                          <Badge className="ml-2 bg-blue-100 hover:bg-blue-100 text-blue-800 border-blue-300" variant="outline">
                            Seasonal
                          </Badge>
                        )}
                      </h3>
                      {route.description && (
                        <p className="text-sm text-muted-foreground mt-1">{route.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setNewCabType({ name: "", price: 0, route_id: route.id, season_name: "", season_start: "", season_end: "" });
                          setIsEditMode(false);
                          setIsCabTypeDialogOpen(true);
                        }}
                        className="text-xs h-8"
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add Cab
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setNewRoute({
                                id: route.id,
                                name: route.name,
                                description: route.description,
                              });
                              setIsEditMode(true);
                              setIsRouteDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Route
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteRoute(route.id)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Route
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Cab Types Table */}
                  <div className="p-4">
                    {route.cab_types.length === 0 ? (
                      <div className="text-center py-4 border rounded-md bg-muted/20">
                        <p className="text-sm text-muted-foreground">No cab types added yet</p>
                        <Button 
                          variant="link" 
                          size="sm"
                          onClick={() => {
                            setNewCabType({ name: "", price: 0, route_id: route.id, season_name: "", season_start: "", season_end: "" });
                            setIsEditMode(false);
                            setIsCabTypeDialogOpen(true);
                          }}
                          className="mt-1"
                        >
                          Add a cab type
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cab Type</TableHead>
                            <TableHead className="text-right">Price (₹)</TableHead>
                            <TableHead>Season</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {renderCabTypesByGroup(route.cab_types)}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Pencil, Trash2, Building2, Star, Search, Loader2, Eye, Filter, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Hotel } from "@/types/hotel";
import { fetchHotels, deleteHotel, fetchHotelWithRates } from "@/services/hotelService";
import { HotelForm } from "@/components/HotelForm";

export default function Hotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState<Hotel | null>(null);
  const [selectedHotelWithRates, setSelectedHotelWithRates] = useState<any>(null);
  const [loadingHotelDetails, setLoadingHotelDetails] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [starFilter, setStarFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const navigate = useNavigate();

  // Fetch hotels on mount
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        const data = await fetchHotels();
        setHotels(data);
      } catch (err) {
        console.error("Error loading hotels:", err);
        setError("Failed to load hotels. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadHotels();
  }, []);

  // Extract unique countries, cities, and star categories for filters
  const uniqueCountries = [...new Set(hotels.map(hotel => hotel.country))].sort();
  const uniqueCities = [...new Set(hotels.map(hotel => hotel.city))].sort();
  const uniqueStarCategories = [...new Set(hotels.map(hotel => hotel.star_category))].sort((a, b) => a - b);

  // Count active filters
  const activeFilterCount = 
    (starFilter !== "all" ? 1 : 0) + 
    (countryFilter !== "all" ? 1 : 0) + 
    (cityFilter !== "all" ? 1 : 0);

  // Reset all filters
  const resetFilters = () => {
    setStarFilter("all");
    setCountryFilter("all");
    setCityFilter("all");
  };

  // Filter hotels based on search term and filters
  const filteredHotels = hotels.filter(
    (hotel) => {
      // Normalize search term (trim, lowercase)
      const term = searchTerm.trim().toLowerCase();
      
      // First apply text search
      const searchMatch = !term || 
        hotel.name.toLowerCase().includes(term) ||
        hotel.city?.toLowerCase().includes(term) ||
        hotel.state?.toLowerCase().includes(term) ||
        hotel.country?.toLowerCase().includes(term) ||
        hotel.address?.toLowerCase().includes(term) ||
        (hotel.description?.toLowerCase().includes(term) || false) ||
        `${hotel.star_category} star`.includes(term);
      
      // Then apply filters
      const starMatch = starFilter === "all" || hotel.star_category === parseInt(starFilter);
      const countryMatch = countryFilter === "all" || hotel.country === countryFilter;
      const cityMatch = cityFilter === "all" || hotel.city === cityFilter;
      
      return searchMatch && starMatch && countryMatch && cityMatch;
    }
  );

  // Handle hotel deletion
  const handleDeleteHotel = async () => {
    if (!hotelToDelete) return;
    
    try {
      await deleteHotel(hotelToDelete.id);
      setHotels(hotels.filter(hotel => hotel.id !== hotelToDelete.id));
      setDeleteDialogOpen(false);
      setHotelToDelete(null);
      setViewDialogOpen(false);
    } catch (err) {
      console.error("Error deleting hotel:", err);
      setError("Failed to delete hotel. Please try again.");
    }
  };

  // Render stars for star category
  const renderStars = (count: number) => {
    return Array(count)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
      ));
  };

  // Handle dialog close
  const handleDialogClose = (refresh: boolean = false) => {
    setOpenDialog(false);
    setSelectedHotel(null);
    
    if (refresh) {
      setLoading(true);
      fetchHotels()
        .then(data => {
          setHotels(data);
        })
        .catch(err => {
          console.error("Error refreshing hotels:", err);
          setError("Failed to refresh hotels. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  // View hotel details
  const handleViewHotel = async (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setLoadingHotelDetails(true);
    
    try {
      const hotelWithRates = await fetchHotelWithRates(hotel.id);
      setSelectedHotelWithRates(hotelWithRates);
      setViewDialogOpen(true);
    } catch (err) {
      console.error("Error fetching hotel details:", err);
      setError("Failed to load hotel details. Please try again.");
    } finally {
      setLoadingHotelDetails(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Hotel Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage hotel information and room rates for your customers
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedHotel(null);
            setOpenDialog(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 h-10 sm:h-9 px-4 sm:px-3 text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Hotel
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <CardTitle className="text-lg">Hotels</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Filter Button */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 mr-1 relative"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge 
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Filter Hotels</h4>
                    
                    {/* Star Category Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Star Category</label>
                      <Select 
                        value={starFilter} 
                        onValueChange={setStarFilter}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {uniqueStarCategories.map(stars => (
                            <SelectItem key={stars} value={stars.toString()}>
                              <div className="flex items-center gap-1">
                                {renderStars(stars)}
                                <span className="ml-1">
                                  ({stars} {stars === 1 ? "Star" : "Stars"})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Country Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Country</label>
                      <Select 
                        value={countryFilter} 
                        onValueChange={(value) => {
                          setCountryFilter(value);
                          if (value !== "all") {
                            // Reset city filter if country changes
                            setCityFilter("all");
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="All Countries" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Countries</SelectItem>
                          {uniqueCountries.map(country => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* City Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">City</label>
                      <Select 
                        value={cityFilter} 
                        onValueChange={setCityFilter}
                        disabled={countryFilter === "all"}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="All Cities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cities</SelectItem>
                          {uniqueCities
                            .filter(city => {
                              if (countryFilter === "all") return true;
                              return hotels.some(h => h.city === city && h.country === countryFilter);
                            })
                            .map(city => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Reset Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={resetFilters}
                      disabled={activeFilterCount === 0}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search hotels..."
                  className="pl-8 w-full sm:w-[260px] h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="text-center">
                <div className="bg-emerald-500/10 rounded-full p-3 inline-flex mx-auto mb-4">
                  <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                </div>
                <p className="text-muted-foreground">Loading hotels...</p>
              </div>
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-medium">No hotels found</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                {searchTerm || activeFilterCount > 0
                  ? "No hotels match your search criteria. Try adjusting your search or filters."
                  : "You haven't added any hotels yet. Click 'Add Hotel' to create your first hotel."}
              </p>
              {(searchTerm || activeFilterCount > 0) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    resetFilters();
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Active filters display */}
              {activeFilterCount > 0 && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  
                  {starFilter !== "all" && (
                    <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
                      <div className="flex">
                        {renderStars(parseInt(starFilter))}
                      </div>
                      <button 
                        className="ml-1 rounded-full hover:bg-muted"
                        onClick={() => setStarFilter("all")}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {countryFilter !== "all" && (
                    <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
                      <MapPin className="h-3 w-3" /> {countryFilter}
                      <button 
                        className="ml-1 rounded-full hover:bg-muted"
                        onClick={() => {
                          setCountryFilter("all");
                          setCityFilter("all");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {cityFilter !== "all" && (
                    <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
                      <MapPin className="h-3 w-3" /> {cityFilter}
                      <button 
                        className="ml-1 rounded-full hover:bg-muted"
                        onClick={() => setCityFilter("all")}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={resetFilters}
                  >
                    Clear all
                  </Button>
                </div>
              )}
              
              {/* Hotels table */}
              <div className="overflow-auto -mx-6">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHotels.map((hotel) => (
                      <TableRow key={hotel.id}>
                        <TableCell className="font-medium">{hotel.name}</TableCell>
                        <TableCell>
                          {hotel.city}, {hotel.state}, {hotel.country}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {renderStars(hotel.star_category)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewHotel(hotel)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedHotel(hotel);
                                setOpenDialog(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                setHotelToDelete(hotel);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Hotel Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hotel Details</DialogTitle>
            <DialogDescription>
              View detailed information about this hotel
            </DialogDescription>
          </DialogHeader>
          
          {loadingHotelDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="bg-emerald-500/10 rounded-full p-3 inline-flex mx-auto mb-4">
                  <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                </div>
                <p className="text-muted-foreground">Loading hotel details...</p>
              </div>
            </div>
          ) : selectedHotelWithRates ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">{selectedHotelWithRates.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  {renderStars(selectedHotelWithRates.star_category)}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({selectedHotelWithRates.star_category} Star)
                  </span>
                </div>
                <p className="text-sm mb-2">{selectedHotelWithRates.address}</p>
                <p className="text-sm mb-3">
                  {selectedHotelWithRates.city}, {selectedHotelWithRates.state}, {selectedHotelWithRates.country} {selectedHotelWithRates.pincode}
                </p>
                {selectedHotelWithRates.description && (
                  <p className="text-sm text-muted-foreground mb-3">{selectedHotelWithRates.description}</p>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {selectedHotelWithRates.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span> {selectedHotelWithRates.phone}
                    </div>
                  )}
                  {selectedHotelWithRates.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span> {selectedHotelWithRates.email}
                    </div>
                  )}
                  {selectedHotelWithRates.website && (
                    <div>
                      <span className="text-muted-foreground">Website:</span>{" "}
                      <a 
                        href={selectedHotelWithRates.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline"
                      >
                        {selectedHotelWithRates.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">Room Rates</h4>
                {selectedHotelWithRates.room_rates?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedHotelWithRates.room_rates.map((rate: any) => (
                      <Card key={rate.id} className="relative overflow-hidden">
                        {!rate.is_active && (
                          <div className="absolute inset-0 bg-muted/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <div className="bg-destructive/90 text-destructive-foreground text-xs font-medium py-1 px-2 rounded-sm transform -rotate-12">
                              Inactive
                            </div>
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{rate.room_type}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Max Occupancy: {rate.max_occupancy} persons
                          </p>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">CP Rate:</span>{" "}
                              <span className="font-medium">{formatCurrency(rate.cp_rate)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">MAP Rate:</span>{" "}
                              <span className="font-medium">{formatCurrency(rate.map_rate)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">EP Rate:</span>{" "}
                              <span className="font-medium">{formatCurrency(rate.ep_rate)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Extra Adult:</span>{" "}
                              <span className="font-medium">{formatCurrency(rate.extra_adult_rate)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Extra Child:</span>{" "}
                              <span className="font-medium">{formatCurrency(rate.extra_child_rate)}</span>
                            </div>
                            {(rate.season_start || rate.season_end) && (
                              <div>
                                <span className="text-muted-foreground">Season:</span>{" "}
                                <span className="font-medium">
                                  {rate.season_start || "Any"} to {rate.season_end || "Any"}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/50 rounded-md">
                    <p className="text-muted-foreground">No room rates defined yet</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between gap-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setHotelToDelete(selectedHotel);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Hotel
                </Button>
                <Button
                  onClick={() => {
                    setOpenDialog(true);
                    setViewDialogOpen(false);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Hotel
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Could not load hotel details</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Hotel Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedHotel ? "Edit Hotel" : "Add New Hotel"}
            </DialogTitle>
            <DialogDescription>
              {selectedHotel
                ? "Update the hotel information and room rates"
                : "Add a new hotel to your system with detailed information"}
            </DialogDescription>
          </DialogHeader>
          
          <HotelForm 
            hotel={selectedHotel} 
            onClose={handleDialogClose} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Hotel</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the hotel
              and all its room rate information.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{hotelToDelete?.name}</span>?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteHotel}
            >
              Delete Hotel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
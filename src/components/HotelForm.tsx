import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Star, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createHotel, updateHotel, createRoomRate, updateRoomRate, deleteRoomRate, fetchHotelWithRates } from "@/services/hotelService";
import { Hotel, RoomRate, HotelWithRates } from "@/types/hotel";

// Define schema for hotel form
const hotelFormSchema = z.object({
  name: z.string().min(2, "Hotel name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  pincode: z.string().optional(),
  star_category: z.coerce.number().min(1).max(7),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  amenities: z.array(z.string()).optional(),
  image_url: z.string().url("Invalid URL").optional().or(z.literal('')),
});

// Define schema for room rate form
const roomRateSchema = z.object({
  room_type: z.string().min(2, "Room type is required"),
  cp_rate: z.coerce.number().min(0, "Rate must be a positive number"),
  map_rate: z.coerce.number().min(0, "Rate must be a positive number"),
  ep_rate: z.coerce.number().min(0, "Rate must be a positive number"),
  extra_adult_rate: z.coerce.number().min(0, "Rate must be a positive number"),
  extra_child_rate: z.coerce.number().min(0, "Rate must be a positive number"),
  max_occupancy: z.coerce.number().min(1, "Occupancy must be at least 1"),
  season_start: z.string().optional(),
  season_end: z.string().optional(),
  is_active: z.boolean().default(true),
});

type HotelFormValues = z.infer<typeof hotelFormSchema>;
type RoomRateFormValues = z.infer<typeof roomRateSchema>;

interface HotelFormProps {
  hotel: Hotel | null;
  onClose: (refresh?: boolean) => void;
}

export function HotelForm({ hotel, onClose }: HotelFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotelWithRates, setHotelWithRates] = useState<HotelWithRates | null>(null);
  const [roomRates, setRoomRates] = useState<RoomRate[]>([]);
  
  // Hotel details form
  const hotelForm = useForm<HotelFormValues>({
    resolver: zodResolver(hotelFormSchema),
    defaultValues: {
      name: hotel?.name || "",
      address: hotel?.address || "",
      city: hotel?.city || "",
      state: hotel?.state || "",
      country: hotel?.country || "",
      pincode: hotel?.pincode || "",
      star_category: hotel?.star_category || 3,
      description: hotel?.description || "",
      phone: hotel?.phone || "",
      email: hotel?.email || "",
      website: hotel?.website || "",
      amenities: hotel?.amenities || [],
      image_url: hotel?.image_url || "",
    },
  });

  // Room rate form
  const roomRateForm = useForm<RoomRateFormValues>({
    resolver: zodResolver(roomRateSchema),
    defaultValues: {
      room_type: "",
      cp_rate: 0,
      map_rate: 0,
      ep_rate: 0,
      extra_adult_rate: 0,
      extra_child_rate: 0,
      max_occupancy: 2,
      season_start: "",
      season_end: "",
      is_active: true,
    },
  });

  // Fetch hotel with rates on initial load
  useEffect(() => {
    if (hotel?.id) {
      setLoading(true);
      fetchHotelWithRates(hotel.id)
        .then((data) => {
          if (data) {
            setHotelWithRates(data);
            setRoomRates(data.room_rates || []);
          }
        })
        .catch((err) => {
          console.error("Error fetching hotel with rates:", err);
          setError("Failed to load hotel data");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [hotel]);

  // Handle hotel form submit
  const onHotelSubmit = async (data: HotelFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      if (hotel?.id) {
        // Update existing hotel
        await updateHotel(hotel.id, data);
      } else {
        // Create new hotel
        // Ensure all required fields are present
        const newHotel: Omit<Hotel, "id" | "created_at" | "updated_at"> = {
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          star_category: data.star_category,
          pincode: data.pincode,
          description: data.description,
          amenities: data.amenities,
          phone: data.phone,
          email: data.email,
          website: data.website,
          image_url: data.image_url,
        };
        await createHotel(newHotel);
      }
      onClose(true); // Close with refresh
    } catch (err) {
      console.error("Error saving hotel:", err);
      setError("Failed to save hotel data");
      setLoading(false);
    }
  };

  // Handle room rate form submit
  const onRoomRateSubmit = async (data: RoomRateFormValues) => {
    if (!hotel?.id) {
      setError("Please save hotel details first");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Create new room rate with all required fields
      const newRoomRate: Omit<RoomRate, "id" | "created_at" | "updated_at"> = {
        hotel_id: hotel.id,
        room_type: data.room_type,
        cp_rate: data.cp_rate,
        map_rate: data.map_rate,
        ep_rate: data.ep_rate,
        extra_adult_rate: data.extra_adult_rate,
        extra_child_rate: data.extra_child_rate,
        max_occupancy: data.max_occupancy,
        season_start: data.season_start,
        season_end: data.season_end,
        is_active: data.is_active,
      };
      
      await createRoomRate(newRoomRate);
      
      // Refresh room rates
      const updatedHotel = await fetchHotelWithRates(hotel.id);
      if (updatedHotel) {
        setHotelWithRates(updatedHotel);
        setRoomRates(updatedHotel.room_rates || []);
      }
      
      // Reset form
      roomRateForm.reset({
        room_type: "",
        cp_rate: 0,
        map_rate: 0,
        ep_rate: 0,
        extra_adult_rate: 0,
        extra_child_rate: 0,
        max_occupancy: 2,
        season_start: "",
        season_end: "",
        is_active: true,
      });
    } catch (err) {
      console.error("Error saving room rate:", err);
      setError("Failed to save room rate data");
    } finally {
      setLoading(false);
    }
  };

  // Handle room rate deletion
  const handleDeleteRoomRate = async (rateId: string) => {
    if (!hotel?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteRoomRate(rateId);
      
      // Refresh room rates
      const updatedHotel = await fetchHotelWithRates(hotel.id);
      if (updatedHotel) {
        setHotelWithRates(updatedHotel);
        setRoomRates(updatedHotel.room_rates || []);
      }
    } catch (err) {
      console.error("Error deleting room rate:", err);
      setError("Failed to delete room rate");
    } finally {
      setLoading(false);
    }
  };

  // Render stars for category selection
  const renderCategoryStars = (count: number) => {
    return Array(count)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
      ));
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
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Hotel Details</TabsTrigger>
          <TabsTrigger value="rates" disabled={!hotel?.id}>
            Room Rates
          </TabsTrigger>
        </TabsList>
        
        {/* Hotel Details Tab */}
        <TabsContent value="details">
          <Form {...hotelForm}>
            <form onSubmit={hotelForm.handleSubmit(onHotelSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={hotelForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hotel Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Hotel Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={hotelForm.control}
                  name="star_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Star Category</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select star category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7].map((stars) => (
                            <SelectItem key={stars} value={stars.toString()}>
                              <div className="flex items-center gap-1">
                                {renderCategoryStars(stars)}
                                <span className="ml-1">
                                  ({stars} {stars === 1 ? "Star" : "Stars"})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={hotelForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Hotel Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={hotelForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={hotelForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={hotelForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={hotelForm.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal/Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal/Zip Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={hotelForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={hotelForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={hotelForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="Website URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={hotelForm.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Image URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={hotelForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Hotel description..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onClose()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {hotel ? "Update Hotel" : "Add Hotel"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        {/* Room Rates Tab */}
        <TabsContent value="rates">
          {loading && !roomRates.length ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="bg-emerald-500/10 rounded-full p-3 inline-flex mx-auto mb-4">
                  <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                </div>
                <p className="text-muted-foreground">Loading room rates...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Room Rates</h3>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {roomRates.length} {roomRates.length === 1 ? "Rate" : "Rates"}
                  </div>
                </div>
                
                {roomRates.length > 0 && (
                  <div className="space-y-3">
                    {roomRates.map((rate) => (
                      <Card key={rate.id} className="relative overflow-hidden">
                        {!rate.is_active && (
                          <div className="absolute inset-0 bg-muted/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <div className="bg-destructive/90 text-destructive-foreground text-xs font-medium py-1 px-2 rounded-sm transform -rotate-12">
                              Inactive
                            </div>
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{rate.room_type}</CardTitle>
                              <CardDescription>
                                Max Occupancy: {rate.max_occupancy} persons
                              </CardDescription>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive h-8 w-8 p-0"
                              onClick={() => handleDeleteRoomRate(rate.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                          </div>
                          
                          {(rate.season_start || rate.season_end) && (
                            <div className="mt-3 text-xs text-muted-foreground">
                              Season: {rate.season_start || "Any"} to {rate.season_end || "Any"}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">Add New Room Rate</h4>
                <Form {...roomRateForm}>
                  <form onSubmit={roomRateForm.handleSubmit(onRoomRateSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={roomRateForm.control}
                        name="room_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Type</FormLabel>
                            <FormControl>
                              <Input placeholder="Deluxe Room" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={roomRateForm.control}
                        name="max_occupancy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Occupancy</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={roomRateForm.control}
                        name="cp_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CP Rate (₹)</FormLabel>
                            <FormDescription className="text-xs">Continental Plan</FormDescription>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={roomRateForm.control}
                        name="map_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MAP Rate (₹)</FormLabel>
                            <FormDescription className="text-xs">Modified American Plan</FormDescription>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={roomRateForm.control}
                        name="ep_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>EP Rate (₹)</FormLabel>
                            <FormDescription className="text-xs">European Plan</FormDescription>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={roomRateForm.control}
                        name="extra_adult_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extra Adult Rate (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={roomRateForm.control}
                        name="extra_child_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extra Child Rate (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={roomRateForm.control}
                        name="season_start"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Season Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={roomRateForm.control}
                        name="season_end"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Season End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={roomRateForm.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                              Set whether this room rate is currently active
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Room Rate
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
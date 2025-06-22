import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ItineraryBuilder as ItineraryBuilderComponent } from "@/components/itinerary/ItineraryBuilder";
import { ArrowLeft, Save, Download, Share2, Building2, Star, Car, Mail } from "lucide-react";
import { PDFDownloadLink, BlobProvider } from "@react-pdf/renderer";
import ItineraryPDF from "@/components/itinerary/ItineraryPDF";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import SendItineraryEmailButton from "@/components/itinerary/SendItineraryEmailButton";
import ShareViaWhatsAppButton from "@/components/itinerary/ShareViaWhatsAppButton";
import { TermsConditionsSection } from "@/components/itinerary/TermsConditionsSection";

// Import WhatsApp icon
const WhatsAppIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function ItineraryBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("builder");
  const [isSaving, setIsSaving] = useState(false);

  // Add company settings hook
  const { companySettings } = useCompanySettings();
  
  // Add state for pricing options
  const [pricingOptions, setPricingOptions] = useState({
    taxPercentage: 0,
    agentCharges: 0,
    additionalServices: [],
    showPerPersonPrice: false
  });
  
  // Cab type options
  const cabTypes = [
    { value: "WagonR/Hatchback", label: "WagonR/Hatchback" },
    { value: "Innova/Xylo", label: "Innova/Xylo" },
    { value: "Innova Crysta", label: "Innova Crysta" },
    { value: "Sumo/Bolero", label: "Sumo/Bolero" },
    { value: "tempo", label: "Tempo Traveller" },
    { value: "bus", label: "Bus" },
    { value: "train", label: "Train" },
    { value: "flight", label: "Flight" }
  ];
  
  // Helper to get cab type label
  const getCabTypeLabel = (value: string) => {
    const cab = cabTypes.find(c => c.value === value);
    return cab ? cab.label : value;
  };

  // Fetch itinerary data
  const { 
    data: itinerary, 
    isLoading: loadingItinerary,
    error: itineraryError
  } = useQuery({
    queryKey: ["itinerary", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("itineraries")
        .select("*, customers(*), customer_email, customer_phone")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch itinerary days
  const { 
    data: days = [], 
    isLoading: loadingDays,
  } = useQuery({
    queryKey: ["itineraryDays", id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from("itinerary_days")
        .select("*, hotel:hotel_id(*), route_name, route_description, cab_type, cab_price")
        .eq("itinerary_id", id)
        .order("day_number");
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch activities for all days
  const { 
    data: activities = [], 
    isLoading: loadingActivities 
  } = useQuery({
    queryKey: ["itineraryActivities", id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from("itinerary_activities")
        .select("*, itinerary_day:itinerary_day_id(day_number)")
        .eq("itinerary_day.itinerary_id", id)
        .order("sort_order");
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch pricing options from local storage or database
  useEffect(() => {
    if (id) {
      // Try to load from local storage first
      const savedOptions = localStorage.getItem(`pricing_options_${id}`);
      if (savedOptions) {
        try {
          setPricingOptions(JSON.parse(savedOptions));
        } catch (e) {
          console.error("Error parsing saved pricing options:", e);
        }
      }
    }
  }, [id]);

  // Save pricing options to local storage when they change
  useEffect(() => {
    if (id && Object.keys(pricingOptions).length > 0) {
      localStorage.setItem(`pricing_options_${id}`, JSON.stringify(pricingOptions));
    }
  }, [id, pricingOptions]);

  // Handle save and return to itineraries page
  const handleSaveAndExit = async () => {
    setIsSaving(true);
    try {
      // Update the itinerary's last modified date
      await supabase
        .from("itineraries")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);

      toast.success("Itinerary saved successfully");
      navigate("/itineraries");
    } catch (error) {
      console.error("Error saving itinerary:", error);
      toast.error("Failed to save itinerary");
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for WhatsApp
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for WhatsApp
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle share via WhatsApp with improved formatting
  const handleShareViaWhatsApp = () => {
    if (!itinerary) return;
    
    // Create a well-formatted message for WhatsApp
    let message = `*${itinerary.name}*\n`;
    
    // Add destination if available
    if (itinerary.destination) {
      message += `📍 *${itinerary.destination}*\n`;
    }
    
    // Add date range if available
    if (itinerary.start_date && itinerary.end_date) {
      message += `🗓️ ${formatDate(itinerary.start_date)} to ${formatDate(itinerary.end_date)}\n`;
    }
    
    // Add duration if available
    if (itinerary.duration) {
      message += `⏱️ ${itinerary.duration} day${itinerary.duration > 1 ? 's' : ''}\n`;
    }
    
    message += '\n'; // Add spacing

    // Add each day with its activities
    days.forEach(day => {
      const dayActivities = activities.filter(a => a.itinerary_day_id === day.id);
      
      // Add day header with emoji
      message += `*📆 Day ${day.day_number}`;
      if (day.date) {
        message += ` - ${formatDate(day.date)}`;
      }
      message += '*\n\n';
      
      // Add hotel information if available
      if (day.hotel) {
        message += `🏨 *Accommodation:* ${day.hotel.name}`;
        if (day.hotel.star_category) {
          message += ` ${Array(day.hotel.star_category).fill('⭐').join('')}`;
        }
        message += `\n📍 ${day.hotel.city}, ${day.hotel.state}, ${day.hotel.country}\n\n`;
      }
      
      // Add route information if available - Updated to focus on route name
      if (day.route_name) {
        message += `🚗 *Route:* ${day.route_name}\n`;
        if (day.route_description) {
          message += `${day.route_description}\n`;
        }
        if (day.cab_type) {
          message += `🚕 Transport: ${day.cab_type}`;
          
          // Add cab quantity if more than 1
          if (day.cab_quantity && day.cab_quantity > 1) {
            message += ` x${day.cab_quantity}`;
          }
          
          if (day.cab_price) {
            message += ` (₹${day.cab_price.toFixed(2)})`;
          }
          message += `\n\n`;
        } else {
          message += `\n\n`;
        }
      } else if (day.cab_type) {
        // Fallback to cab type if no route name
        message += `🚕 *Transport Type:* ${day.cab_type}`;
        
        // Add cab quantity if more than 1
        if (day.cab_quantity && day.cab_quantity > 1) {
          message += ` x${day.cab_quantity}`;
        }
        
        // Add price if available
        if (day.cab_price) {
          message += ` (₹${day.cab_price.toFixed(2)})`;
        }
        
        message += `\n\n`;
      }
      
      if (dayActivities.length === 0) {
        message += "No activities planned for this day\n\n";
      } else {
        // Add each activity with appropriate emoji and formatting
        dayActivities.forEach(activity => {
          // Choose emoji based on activity type
          const emoji = activity.is_transfer ? '🚗' : '🔷';
          
          // Add activity title with time if available
          if (activity.time_start) {
            message += `${emoji} *${formatTime(activity.time_start)}* - ${activity.title}\n`;
          } else {
            message += `${emoji} *${activity.title}*\n`;
          }
          
          // Add location if available
          if (activity.location) {
            message += `📍 ${activity.location}\n`;
          }
          
          // Add description if available
          if (activity.description) {
            message += `${activity.description}\n`;
          }
          
          message += '\n'; // Add spacing between activities
        });
      }
      
      message += '\n'; // Add extra spacing between days
    });
    
    // Add footer
    message += `\n*Shared via Triptics Itinerary Builder*`;
    
    // Get customer phone number if available
    const phoneNumber = itinerary.customer_phone || itinerary.customers?.phone;
    const encodedMessage = encodeURIComponent(message);
    
    // If we have a phone number, use it; otherwise open WhatsApp without a specific recipient
    if (phoneNumber) {
      // Format phone number to ensure it has country code (assuming +91 for India if not provided)
      let formattedNumber = phoneNumber.trim();
      
      // If the number doesn't start with +, add the country code
      if (!formattedNumber.startsWith('+')) {
        // Remove any leading zeros
        formattedNumber = formattedNumber.replace(/^0+/, '');
        
        // If it doesn't start with a country code (like 91), add it
        if (!formattedNumber.startsWith('91')) {
          formattedNumber = '91' + formattedNumber;
        }
        
        // Add the + prefix
        formattedNumber = '+' + formattedNumber;
      }
      
      // Remove any spaces, dashes, or parentheses
      formattedNumber = formattedNumber.replace(/[\s\-()]/g, '');
      
      window.open(`https://wa.me/${formattedNumber}?text=${encodedMessage}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };

  // Handle back button click
  const handleBack = () => {
    navigate("/itineraries");
  };

  if (loadingItinerary || loadingDays || loadingActivities) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (itineraryError || !itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-semibold mb-2">Error loading itinerary</h2>
        <p className="text-muted-foreground mb-4">
          {(itineraryError as Error)?.message || "Itinerary not found"}
        </p>
        <Button onClick={handleBack} className="bg-emerald-500 hover:bg-emerald-600">Return to Itineraries</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack} 
            className="flex items-center gap-1 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 h-9 w-9 p-0 sm:h-8 sm:w-auto sm:px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold truncate">{itinerary.name}</h1>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div className="text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <span>
                {itinerary.start_date && itinerary.end_date
                  ? `${new Date(itinerary.start_date).toLocaleDateString()} - ${new Date(itinerary.end_date).toLocaleDateString()}`
                  : "No dates set"}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>{itinerary.duration} days</span>
              {itinerary.destination && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span>{itinerary.destination}</span>
                </>
              )}
              {itinerary.transfer_included && itinerary.transfer_included !== 'no' && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span>{itinerary.transfer_included === 'partial' ? 'Partial transfers' : 'Transfers included'}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => handleSaveAndExit()} 
              disabled={isSaving}
              variant="outline" 
              size="sm" 
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 flex-1 sm:flex-initial h-10 sm:h-9"
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save & Exit'}</span>
            </Button>
            
            <BlobProvider
              document={
                <ItineraryPDF 
                  itinerary={itinerary} 
                  days={days} 
                  activities={activities} 
                  companySettings={companySettings}
                  pricingOptions={pricingOptions}
                />
              }
            >
              {({ blob, url, loading, error }) => (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={loading}
                    onClick={() => {
                      if (blob) {
                        // Create a URL for the blob
                        const blobUrl = window.URL.createObjectURL(blob);
                        
                        // Create a link element
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = `${itinerary.name.replace(/\s+/g, '_')}.pdf`;
                        
                        // Append to the document, click, and remove
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        // Release the blob URL
                        window.URL.revokeObjectURL(blobUrl);
                        
                        toast.success("PDF downloaded successfully");
                      } else if (error) {
                        toast.error("Failed to generate PDF. Please try again.");
                        console.error("PDF generation error:", error);
                      }
                    }}
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 w-full h-10 sm:h-9 flex-1 sm:flex-initial"
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{loading ? 'Generating...' : 'Download PDF'}</span>
                  </Button>
                  
                  <SendItineraryEmailButton
                    itinerary={itinerary}
                    days={days}
                    activities={activities}
                    size="sm"
                    variant="outline"
                    buttonText="Send via Email"
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 w-full sm:w-auto h-10 sm:h-9 flex-1 sm:flex-initial"
                    pdfBlob={blob}
                    pricingOptions={pricingOptions}
                  />
                </>
              )}
            </BlobProvider>
            
            <ShareViaWhatsAppButton
              itinerary={itinerary}
              days={days}
              activities={activities}
              size="sm"
              variant="default"
              buttonText="Share"
              className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1 sm:flex-initial h-10 sm:h-9"
              pricingOptions={pricingOptions}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4 sm:mb-6">
          <TabsTrigger value="builder" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 h-10 sm:h-9">Day Builder</TabsTrigger>
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 h-10 sm:h-9">Overview</TabsTrigger>
          <TabsTrigger value="preview" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 h-10 sm:h-9">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="builder" className="mt-0">
          <ItineraryBuilderComponent 
            itinerary={itinerary} 
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["itineraryDays", id] });
              queryClient.invalidateQueries({ queryKey: ["itineraryActivities", id] });
            }}
            isStandalone={true}
            pricingOptions={pricingOptions}
            onPricingOptionsChange={setPricingOptions}
          />
        </TabsContent>
        
        <TabsContent value="overview" className="mt-0">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {days.map((day) => {
                const dayActivities = activities.filter(activity => 
                  activity.itinerary_day_id === day.id
                );
                
                return (
                  <div key={day.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="font-medium">Day {day.day_number}</div>
                    {day.date && (
                      <div className="text-sm text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    )}
                    
                    {/* Display route information - Updated to include description */}
                    {day.route_name && (
                      <div className="mt-2 p-2 bg-white border rounded-md">
                        <div className="flex items-center gap-1">
                          <Car className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-800">Route: {day.route_name}</span>
                        </div>
                        {day.route_description && (
                          <div className="ml-6 text-xs text-gray-700 mt-1">
                            {day.route_description}
                          </div>
                        )}
                        {day.cab_type ? (
                          <div className="mt-2 text-xs flex items-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {day.cab_type}
                              {day.cab_quantity > 1 && (
                                <span className="ml-1">
                                  x{day.cab_quantity}
                                </span>
                              )}
                              {day.cab_price && (
                                <span className="ml-1 font-medium">
                                  ₹{day.cab_price.toFixed(2)}
                                </span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="ml-6 text-xs text-muted-foreground mt-1">
                            No transport type selected
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Display hotel information */}
                    {day.hotel && (
                      <div className="mt-2 p-2 bg-white border rounded-md">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                          <span className="font-medium text-gray-800">{day.hotel.name}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <span>{day.hotel.city}, {day.hotel.state}</span>
                          <span className="flex items-center ml-2">
                            {Array(day.hotel.star_category).fill(0).map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
                            ))}
                          </span>
                        </div>
                        {(day.room_type || day.meal_plan || day.room_price) && (
                          <div className="ml-6 mt-2 pt-1 border-t border-gray-100">
                            {day.room_type && (
                              <div className="text-xs text-gray-700">
                                <span className="font-medium">Room:</span> {day.room_type}
                                {day.room_quantity > 1 && (
                                  <span className="ml-1">
                                    x{day.room_quantity}
                                  </span>
                                )}
                              </div>
                            )}
                            {day.meal_plan && (
                              <div className="text-xs text-gray-700">
                                <span className="font-medium">Meal Plan:</span> {day.meal_plan === "CP" ? "CP (Room Only)" : 
                                                                                day.meal_plan === "MAP" ? "MAP (Breakfast + Dinner)" :
                                                                                day.meal_plan === "AP" ? "AP (All Meals)" :
                                                                                day.meal_plan === "EP" ? "EP (Breakfast Only)" : 
                                                                                day.meal_plan}
                              </div>
                            )}
                            {day.room_price && (
                              <div className="text-xs font-medium text-emerald-600">
                                Price: ₹{day.room_price.toFixed(2)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Display day notes */}
                    {day.notes && (
                      <div className="mt-2 p-2 bg-white border rounded-md">
                        <div className="text-sm font-medium mb-1">Notes:</div>
                        <div className="text-sm text-gray-700 whitespace-pre-line">
                          {day.notes}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-0">
          <div className="border rounded-lg p-4 sm:p-6 max-w-3xl mx-auto space-y-6 sm:space-y-8">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold">{itinerary.name}</h2>
              {itinerary.destination && (
                <p className="text-muted-foreground mt-1">{itinerary.destination}</p>
              )}
              {itinerary.start_date && itinerary.end_date && (
                <p className="mt-2">
                  {new Date(itinerary.start_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })} - {new Date(itinerary.end_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
            
            <div className="space-y-6">
              {days.map((day) => {
                const dayActivities = activities.filter(activity => 
                  activity.itinerary_day_id === day.id
                );
                
                return (
                  <div key={day.id} className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold">Day {day.day_number}</h3>
                      {day.date && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    
                    {/* Display route information - Updated to include description */}
                    {day.route_name && (
                      <div className="bg-white border p-3 rounded-md mb-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium text-gray-800">Route: {day.route_name}</h4>
                        </div>
                        {day.route_description && (
                          <div className="ml-6 mt-1">
                            <p className="text-sm text-gray-700">{day.route_description}</p>
                          </div>
                        )}
                        {day.cab_type ? (
                          <div className="mt-2 text-xs flex items-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {day.cab_type}
                              {day.cab_quantity > 1 && (
                                <span className="ml-1">
                                  x{day.cab_quantity}
                                </span>
                              )}
                              {/* Cab prices are hidden in preview tab */}
                            </span>
                          </div>
                        ) : (
                          <div className="ml-6 mt-1">
                            <p className="text-sm text-muted-foreground">
                              No transport type selected
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Display hotel information */}
                    {day.hotel && (
                      <div className="bg-white border p-3 rounded-md mb-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                          <h4 className="font-medium text-gray-800">Accommodation: {day.hotel.name}</h4>
                        </div>
                        <div className="ml-6 mt-1">
                          <p className="text-sm text-muted-foreground">{day.hotel.address}</p>
                          <p className="text-sm text-muted-foreground">{day.hotel.city}, {day.hotel.state}, {day.hotel.country}</p>
                          <div className="flex items-center mt-1">
                            {Array(day.hotel.star_category).fill(0).map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                        {(day.room_type || day.meal_plan || day.room_price) && (
                          <div className="ml-6 mt-3 pt-2 border-t">
                            {day.room_type && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Room:</span> {day.room_type}
                                {day.room_quantity > 1 && (
                                  <span className="ml-1">
                                    x{day.room_quantity}
                                  </span>
                                )}
                              </p>
                            )}
                            {day.meal_plan && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Meal Plan:</span> {day.meal_plan === "CP" ? "CP (Room Only)" : 
                                                                                day.meal_plan === "MAP" ? "MAP (Breakfast + Dinner)" :
                                                                                day.meal_plan === "AP" ? "AP (All Meals)" :
                                                                                day.meal_plan === "EP" ? "EP (Breakfast Only)" : 
                                                                                day.meal_plan}
                              </p>
                            )}
                            {/* Room prices are hidden in preview tab */}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Display day notes */}
                    {day.notes && (
                      <div className="bg-white border p-3 rounded-md mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">Day Notes:</h4>
                        <p className="text-sm whitespace-pre-line">{day.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Add Terms & Conditions Section above pricing summary */}
            <TermsConditionsSection />
            
            {/* Add pricing summary to preview */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Pricing Summary</h3>
              <div className="space-y-2">
                {/* Calculate totals */}
                {(() => {
                  let accommodationTotal = 0;
                  let transportTotal = 0;
                  
                  // Calculate accommodation costs
                  days.forEach(day => {
                    if (day.room_price) {
                      accommodationTotal += parseFloat(day.room_price);
                    }
                  });
                  
                  // Calculate transport costs
                  days.forEach(day => {
                    if (day.cab_price) {
                      transportTotal += parseFloat(day.cab_price);
                    }
                  });
                  
                  // Calculate additional services
                  const additionalServicesTotal = pricingOptions.additionalServices.reduce(
                    (sum, service) => sum + service.price, 
                    0
                  );
                  
                  // Calculate subtotal
                  const subtotal = accommodationTotal + transportTotal + additionalServicesTotal;
                  
                  // Calculate agent charges
                  const agentCharges = pricingOptions.agentCharges;
                  
                  // Calculate tax
                  const tax = subtotal * (pricingOptions.taxPercentage / 100);
                  
                  // Calculate total
                  const total = subtotal + agentCharges + tax;
                  
                  return (
                    <>
                      {pricingOptions.additionalServices.length > 0 && (
                        <div className="bg-white border rounded-md p-4 mb-4">
                          <div className="text-sm font-medium mb-2">Additional Services</div>
                          <div className="space-y-1">
                            {pricingOptions.additionalServices.map(service => (
                              <div key={service.id} className="flex justify-between text-sm">
                                <span>{service.name}</span>
                                <span>₹{pricingOptions.showPerPersonPrice && itinerary.customers?.adults ? 
                                  Math.round(service.price / itinerary.customers.adults).toFixed(0) : 
                                  service.price.toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="pt-2 mt-1 border-t flex justify-between font-medium">
                              <span>Total Additional Services</span>
                              <span>₹{pricingOptions.showPerPersonPrice && itinerary.customers?.adults ? 
                                Math.round(additionalServicesTotal / itinerary.customers.adults).toFixed(0) : 
                                additionalServicesTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-emerald-50 border border-emerald-100 rounded-md p-4">
                        <div className="space-y-2">
                          {/* Subtotal is hidden from customers */}
                          
                          {/* Hide agent charges in the UI but keep the calculation */}
                          
                          {pricingOptions.taxPercentage > 0 && (
                            <div className="flex justify-between">
                              <span>Tax ({pricingOptions.taxPercentage}%)</span>
                              <span>₹{pricingOptions.showPerPersonPrice && itinerary.customers?.adults ? 
                                Math.round(tax / itinerary.customers.adults).toFixed(0) : 
                                tax.toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div className="pt-2 mt-1 border-t flex justify-between font-bold text-lg">
                            <span>
                              {pricingOptions.showPerPersonPrice ? "Total Per Person" : "Total"}
                              {pricingOptions.showPerPersonPrice && itinerary.customers?.adults && (
                                <span className="text-xs font-normal ml-1">
                                  (based on {itinerary.customers.adults} {itinerary.customers.adults === 1 ? "adult" : "adults"})
                                </span>
                              )}
                            </span>
                            <span className="text-emerald-600">₹{pricingOptions.showPerPersonPrice && itinerary.customers?.adults ? 
                              Math.round(total / itinerary.customers.adults).toFixed(0) : 
                              total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
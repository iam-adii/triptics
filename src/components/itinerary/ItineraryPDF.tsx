import React, { useState, useEffect } from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 20,
    fontFamily: 'Roboto',
    fontSize: 8,
  },
  header: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: '1 solid #e5e7eb',
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1 solid #f3f4f6',
  },
  companyInfo: {
    flex: 1,
  },
  companyLogo: {
    width: 50,
    height: 50,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 2,
  },
  companyContact: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 8,
    textAlign: 'center',
  },
  dateRange: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 8,
    color: '#6b7280',
    width: 60,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 8,
    color: '#111827',
    flex: 1,
  },
  
  // Day section styles
  dayHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#111827',
    backgroundColor: '#f8fafc',
    padding: 6,
    borderLeft: '3 solid #10b981',
  },
  dayDate: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  
  // Route section styles (highlighted and first)
  routeCard: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    border: '1 solid #3b82f6',
  },
  routeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 3,
  },
  routeDescription: {
    fontSize: 8,
    color: '#4b5563',
    marginBottom: 4,
    lineHeight: 1.3,
    fontStyle: 'italic',
  },
  transportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: 3,
    marginTop: 2,
  },
  transportBadge: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  noTransportText: {
    fontSize: 8,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  
  // Hotel section styles (after routes)
  hotelCard: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    border: '1 solid #bbf7d0',
  },
  hotelTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#166534',
  },
  hotelAddress: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 1,
  },
  hotelLocation: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 3,
  },
  starRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starText: {
    fontSize: 7,
    color: '#f59e0b',
    marginLeft: 2,
  },
  roomDetails: {
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: 3,
    marginTop: 3,
    borderTop: '1 solid #d1fae5',
  },
  roomDetailRow: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  roomLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#374151',
    width: 45,
  },
  roomValue: {
    fontSize: 7,
    color: '#111827',
    flex: 1,
  },
  
  // Notes section
  notesCard: {
    marginBottom: 8,
    padding: 6,
    backgroundColor: '#fffbeb',
    borderRadius: 3,
    border: '1 solid #fef3c7',
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 3,
  },
  notesText: {
    fontSize: 7,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  
  // Activity styles
  activityCard: {
    marginBottom: 6,
    padding: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 3,
    borderLeft: '2 solid #e5e7eb',
  },
  activityTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#111827',
  },
  activityTime: {
    fontSize: 7,
    color: '#4b5563',
    marginBottom: 1,
  },
  activityLocation: {
    fontSize: 7,
    color: '#4b5563',
    marginBottom: 1,
  },
  activityDescription: {
    fontSize: 7,
    color: '#111827',
    lineHeight: 1.3,
  },
  
  // Section title
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 6,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    padding: 6,
  },
  
  // Pricing styles
  pricingSection: {
    marginTop: 15,
    marginBottom: 8,
  },
  pricingTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    padding: 6,
  },
  pricingCard: {
    padding: 6,
    backgroundColor: '#f0fff4',
    borderRadius: 3,
    border: '1 solid #c6f6d5',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  pricingLabel: {
    fontSize: 7,
    color: '#4b5563',
  },
  pricingValue: {
    fontSize: 7,
    color: '#111827',
    textAlign: 'right',
  },
  pricingDivider: {
    borderBottom: '1 dashed #e5e7eb',
    marginVertical: 3,
  },
  pricingTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTop: '1 solid #e5e7eb',
  },
  pricingTotalLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
  },
  pricingTotalValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#047857',
    textAlign: 'right',
  },
  
  // Terms styles
  termsSection: {
    marginBottom: 8,
  },
  termsSubtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111827',
  },
  termsItem: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 6,
  },
  bulletPoint: {
    fontSize: 7,
    marginRight: 3,
    color: '#111827',
  },
  termsText: {
    fontSize: 7,
    color: '#111827',
    flex: 1,
    lineHeight: 1.3,
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    fontSize: 6,
    color: '#9ca3af',
    textAlign: 'center',
    paddingTop: 6,
    borderTop: '1 solid #e5e7eb',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    fontSize: 6,
    color: '#9ca3af',
  },
});

interface CompanySettings {
  id: string;
  name: string;
  website: string | null;
  address: string | null;
  country: string | null;
  timezone: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  date?: string;
  hotel_id?: string;
  cab_type?: string;
  route_name?: string;
  route_description?: string;
  cab_price?: number;
  cab_unit_price?: number;
  cab_quantity?: number;
  notes?: string;
  room_type?: string;
  meal_plan?: string;
  room_price?: number;
  room_unit_price?: number;
  room_quantity?: number;
  hotel?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    star_category: number;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

// Add pricing options interface
interface PricingOptions {
  taxPercentage: number;
  agentCharges: number;
  additionalServices: AdditionalService[];
  showPerPersonPrice?: boolean;
}

interface AdditionalService {
  id: string;
  name: string;
  price: number;
}

// Add new interface for Terms & Conditions
interface TermsAndConditions {
  inclusions: string[];
  exclusions: string[];
  terms: string[];
}

// Update ItineraryPDFProps to include pricingOptions
interface ItineraryPDFProps {
  itinerary: any;
  days: any[];
  activities: any[];
  companySettings?: CompanySettings;
  avatarUrl?: string | null;
  pricingOptions?: PricingOptions;
}

// PDF component
const ItineraryPDF: React.FC<ItineraryPDFProps> = ({ 
  itinerary, 
  days, 
  activities, 
  companySettings, 
  avatarUrl,
  pricingOptions 
}) => {
  // Default company settings if not provided
  const company: CompanySettings = companySettings || {
    id: "",
    name: "Your Company Name",
    website: null,
    address: "Update your address in Settings",
    country: null,
    timezone: null,
    logo_url: null,
    phone: null,
    email: null,
    gstin: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Check if the avatar URL is valid
  const hasAvatar = Boolean(avatarUrl && avatarUrl.startsWith('http'));
  
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

  // Calculate pricing summary
  const calculatePricingSummary = () => {
    let accommodationTotal = 0;
    let transportTotal = 0;
    let additionalServicesTotal = 0;
    
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
    
    // Calculate additional services if pricing options exist
    if (pricingOptions) {
      additionalServicesTotal = pricingOptions.additionalServices.reduce(
        (sum, service) => sum + service.price, 
        0
      );
    }
    
    // Calculate subtotal
    const subtotal = accommodationTotal + transportTotal + additionalServicesTotal;
    
    // Calculate agent charges if pricing options exist
    const agentCharges = pricingOptions ? pricingOptions.agentCharges : 0;
    
    // Calculate tax if pricing options exist
    const taxPercentage = pricingOptions ? pricingOptions.taxPercentage : 0;
    const tax = subtotal * (taxPercentage / 100);
    
    // Calculate total
    const total = subtotal + agentCharges + tax;
    
    return {
      accommodationTotal,
      transportTotal,
      additionalServicesTotal,
      subtotal,
      agentCharges,
      tax,
      total,
      taxPercentage
    };
  };
  
  const pricingSummary = calculatePricingSummary();

  // Add state for terms and conditions
  const [termsAndConditions, setTermsAndConditions] = useState<TermsAndConditions>({
    inclusions: [],
    exclusions: [],
    terms: []
  });

  // Fetch terms and conditions
  useEffect(() => {
    const fetchTermsAndConditions = async () => {
      try {
        const { data, error } = await supabase
          .from('terms_and_conditions')
          .select('*')
          .single();

        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('Error fetching terms and conditions:', error);
          }
          return;
        }
        
        if (data) {
          const terms = {
            inclusions: data.inclusions || [],
            exclusions: data.exclusions || [],
            terms: data.terms || []
          };
          console.log('PDF Terms fetched:', terms);
          setTermsAndConditions(terms);
        }
      } catch (error) {
        console.error('Error fetching terms and conditions:', error);
      }
    };

    fetchTermsAndConditions();
  }, []);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            {company.address && (
              <Text style={styles.companyContact}>{company.address}</Text>
            )}
            <Text style={styles.companyContact}>
              {company.phone && `${company.phone}`}
              {company.phone && company.email && " | "}
              {company.email && `${company.email}`}
            </Text>
            {company.website && (
              <Text style={styles.companyContact}>{company.website}</Text>
            )}
            {company.gstin && (
              <Text style={styles.companyContact}>GSTIN: {company.gstin}</Text>
            )}
          </View>
          {hasAvatar && (
            <Image
              src={avatarUrl || ''}
              style={styles.companyLogo}
            />
          )}
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{itinerary.name}</Text>
          {itinerary.destination && (
            <Text style={styles.subtitle}>📍 {itinerary.destination}</Text>
          )}
          {itinerary.start_date && itinerary.end_date && (
            <Text style={styles.dateRange}>
              🗓️ {new Date(itinerary.start_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })} - {new Date(itinerary.end_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client:</Text>
            <Text style={styles.infoValue}>{itinerary.customers?.name || 'Not assigned'}</Text>
          </View>
          
          {itinerary.duration && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoValue}>{itinerary.duration} day{itinerary.duration > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
        
        {/* Days and Activities */}
        {days.map((day: ItineraryDay) => {
          const dayActivities = activities.filter((a: any) => a.itinerary_day_id === day.id);
          
          return (
            <View key={day.id}>
              <View style={styles.dayHeader}>
                <Text>Day {day.day_number}</Text>
                {day.date && (
                  <Text style={styles.dayDate}>
                    {format(new Date(day.date), 'EEEE, MMMM d, yyyy')}
                  </Text>
                )}
              </View>
              
              {/* Route Information FIRST (as requested) */}
              {day.route_name && (
                <View style={styles.routeCard}>
                  <Text style={styles.routeTitle}>🚗 Route: {day.route_name}</Text>
                  {day.route_description && (
                    <Text style={styles.routeDescription}>{day.route_description}</Text>
                  )}
                  {day.cab_type ? (
                    <View style={styles.transportInfo}>
                      <Text style={styles.transportBadge}>
                        {getCabTypeLabel(day.cab_type)}
                        {day.cab_quantity > 1 && ` x${day.cab_quantity}`}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noTransportText}>No transport type selected</Text>
                  )}
                </View>
              )}
              
              {/* Hotel Information SECOND (after routes) */}
              {day.hotel && (
                <View style={styles.hotelCard}>
                  <Text style={styles.hotelTitle}>🏨 Accommodation: {day.hotel.name}</Text>
                  <Text style={styles.hotelAddress}>{day.hotel.address}</Text>
                  <Text style={styles.hotelLocation}>{day.hotel.city}, {day.hotel.state}, {day.hotel.country}</Text>
                  <View style={styles.starRating}>
                    <Text style={styles.starText}>
                      {'⭐'.repeat(day.hotel.star_category)} {day.hotel.star_category} {day.hotel.star_category === 1 ? 'Star' : 'Stars'}
                    </Text>
                  </View>
                  {(day.room_type || day.meal_plan) && (
                    <View style={styles.roomDetails}>
                      {day.room_type && (
                        <View style={styles.roomDetailRow}>
                          <Text style={styles.roomLabel}>Room:</Text>
                          <Text style={styles.roomValue}>
                            {day.room_type}
                            {day.room_quantity > 1 && ` x${day.room_quantity}`}
                          </Text>
                        </View>
                      )}
                      {day.meal_plan && (
                        <View style={styles.roomDetailRow}>
                          <Text style={styles.roomLabel}>Meal Plan:</Text>
                          <Text style={styles.roomValue}>
                            {day.meal_plan === "CP" ? "CP (Room Only)" : 
                             day.meal_plan === "MAP" ? "MAP (Breakfast + Dinner)" :
                             day.meal_plan === "AP" ? "AP (All Meals)" :
                             day.meal_plan === "EP" ? "EP (Breakfast Only)" : 
                             day.meal_plan}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
              
              {/* Day Notes */}
              {day.notes && (
                <View style={styles.notesCard}>
                  <Text style={styles.notesTitle}>📝 Day Notes:</Text>
                  <Text style={styles.notesText}>{day.notes}</Text>
                </View>
              )}
              
              {/* Activities */}
              {dayActivities.length > 0 && dayActivities.map((activity: any) => (
                <View key={activity.id} style={styles.activityCard}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  
                  {(activity.time_start || activity.time_end) && (
                    <Text style={styles.activityTime}>
                      🕐 Time: {' '}
                      {activity.time_start && format(new Date(`2000-01-01T${activity.time_start}`), 'h:mm a')}
                      {activity.time_start && activity.time_end && " - "}
                      {activity.time_end && format(new Date(`2000-01-01T${activity.time_end}`), 'h:mm a')}
                    </Text>
                  )}
                  
                  {activity.location && (
                    <Text style={styles.activityLocation}>
                      📍 Location: {activity.location}
                    </Text>
                  )}
                  
                  {activity.description && (
                    <Text style={styles.activityDescription}>
                      {activity.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          );
        })}
        
        {/* Pricing Summary */}
        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>Pricing Summary</Text>
          <View style={styles.pricingCard}>
            {/* Remove the comment about "Package cost is hidden from customers" since we're not showing it at all */}
            
            {pricingOptions && pricingOptions.additionalServices.length > 0 && (
              <>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Additional Services:</Text>
                  <Text style={styles.pricingValue}></Text>
                </View>
                
                {pricingOptions.additionalServices.map(service => (
                  <View key={service.id} style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>  • {service.name}</Text>
                    <Text style={styles.pricingValue}>
                      ₹{pricingOptions.showPerPersonPrice && itinerary.customers?.adults ? 
                        Math.round(service.price / itinerary.customers.adults).toFixed(0) : 
                        service.price.toFixed(2)}
                    </Text>
                  </View>
                ))}
                
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Additional Services Total</Text>
                  <Text style={styles.pricingValue}>
                    ₹{pricingOptions.showPerPersonPrice && itinerary.customers?.adults ? 
                      Math.round(pricingSummary.additionalServicesTotal / itinerary.customers.adults).toFixed(0) : 
                      pricingSummary.additionalServicesTotal.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.pricingDivider} />
              </>
            )}
            
            {/* Subtotal is hidden from customers */}
            
            {/* Hide agent charges from display but still include in total */}
            
            {pricingOptions && pricingOptions.taxPercentage > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Tax ({pricingSummary.taxPercentage}%)</Text>
                <Text style={styles.pricingValue}>
                  ₹{pricingOptions.showPerPersonPrice && itinerary.customers?.adults ? 
                    Math.round(pricingSummary.tax / itinerary.customers.adults).toFixed(0) : 
                    pricingSummary.tax.toFixed(2)}
                </Text>
              </View>
            )}
            
            <View style={styles.pricingTotal}>
              <Text style={styles.pricingTotalLabel}>
                {pricingOptions?.showPerPersonPrice ? "Total Per Person" : "Total"}
              </Text>
              <Text style={styles.pricingTotalValue}>
                ₹{pricingOptions?.showPerPersonPrice && itinerary.customers?.adults ? 
                  Math.round(pricingSummary.total / itinerary.customers.adults).toFixed(0) : 
                  pricingSummary.total.toFixed(2)}
              </Text>
            </View>
            
            {pricingOptions?.showPerPersonPrice && itinerary.customers?.adults && (
              <Text style={{ fontSize: 6, color: '#4b5563', textAlign: 'right', marginTop: 2 }}>
                Based on {itinerary.customers.adults} {itinerary.customers.adults === 1 ? "adult" : "adults"}
              </Text>
            )}
          </View>
        </View>
        
        {/* Terms & Conditions Section */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          
          {/* Inclusions */}
          {termsAndConditions.inclusions.length > 0 && (
            <View style={styles.termsSection}>
              <Text style={styles.termsSubtitle}>✓ Inclusions:</Text>
              {termsAndConditions.inclusions.map((inclusion, index) => (
                <View key={index} style={styles.termsItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.termsText}>{inclusion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Exclusions */}
          {termsAndConditions.exclusions.length > 0 && (
            <View style={styles.termsSection}>
              <Text style={styles.termsSubtitle}>✗ Exclusions:</Text>
              {termsAndConditions.exclusions.map((exclusion, index) => (
                <View key={index} style={styles.termsItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.termsText}>{exclusion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Terms & Conditions */}
          {termsAndConditions.terms.length > 0 && (
            <View style={styles.termsSection}>
              <Text style={styles.termsSubtitle}>📋 Terms & Conditions:</Text>
              {termsAndConditions.terms.map((term, index) => (
                <View key={index} style={styles.termsItem}>
                  <Text style={styles.bulletPoint}>{index + 1}.</Text>
                  <Text style={styles.termsText}>{term}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Show placeholder if no terms are available */}
          {termsAndConditions.inclusions.length === 0 && 
           termsAndConditions.exclusions.length === 0 && 
           termsAndConditions.terms.length === 0 && (
            <View style={styles.termsSection}>
              <Text style={styles.termsText}>Terms and conditions will be added from the Settings page.</Text>
            </View>
          )}
        </View>
        
        {/* Notes */}
        {itinerary.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 7, lineHeight: 1.3 }}>{itinerary.notes}</Text>
          </>
        )}
        
        {/* Footer */}
        <Text style={styles.footer}>
          {company.name} • Generated on {format(new Date(), 'MMMM d, yyyy')} • {itinerary.name}
        </Text>
        
        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} 
        />
      </Page>
    </Document>
  );
};

export default ItineraryPDF;

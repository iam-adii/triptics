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
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '1 solid #e5e7eb',
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  companyInfo: {
    flex: 1,
  },
  companyLogo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  companyContact: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  infoLabel: {
    fontSize: 10,
    color: '#6b7280',
    width: 80,
  },
  infoValue: {
    fontSize: 10,
    color: '#111827',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  activityCard: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  activityTime: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 5,
  },
  activityLocation: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 10,
    color: '#111827',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    paddingTop: 10,
    borderTop: '1 solid #e5e7eb',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 8,
    color: '#9ca3af',
  },
  hotelCard: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f9fa', // Light gray background instead of green
    borderRadius: 4,
    border: '1 solid #e0e0e0',
  },
  hotelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333333', // Darker text color for better contrast
  },
  hotelDetails: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 2,
  },
  starRating: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  star: {
    width: 8,
    height: 8,
    marginRight: 2,
  },
  cabTypeCard: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f7ff', // Light blue background
    borderRadius: 4,
    border: '1 solid #bfdbfe', // Blue border
  },
  cabTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af', // Darker blue for better contrast
    marginBottom: 2,
  },
  routeDetails: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 2,
  },
  routeDescription: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  notesCard: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fffbeb', // Light yellow background
    borderRadius: 4,
    border: '1 solid #fef3c7', // Yellow border
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e', // Amber text
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  pricingSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  pricingCard: {
    padding: 10,
    backgroundColor: '#f0fff4', // Light green background
    borderRadius: 4,
    border: '1 solid #c6f6d5', // Green border
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pricingLabel: {
    fontSize: 10,
    color: '#4b5563',
  },
  pricingValue: {
    fontSize: 10,
    color: '#111827',
    textAlign: 'right',
  },
  pricingDivider: {
    borderBottom: '1 dashed #e5e7eb',
    marginVertical: 4,
  },
  pricingTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTop: '1 solid #e5e7eb',
  },
  pricingTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  pricingTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#047857', // Green color for total
    textAlign: 'right',
  },
  termsSection: {
    marginBottom: 15,
  },
  termsSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  termsItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 10,
  },
  bulletPoint: {
    fontSize: 10,
    marginRight: 5,
    color: '#111827',
  },
  termsText: {
    fontSize: 10,
    color: '#111827',
    flex: 1,
    lineHeight: 1.4,
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

        if (error) throw error;
        if (data) {
          setTermsAndConditions({
            inclusions: data.inclusions || [],
            exclusions: data.exclusions || [],
            terms: data.terms || []
          });
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
          <Text style={styles.subtitle}>{itinerary.destination || 'No destination specified'}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client:</Text>
            <Text style={styles.infoValue}>{itinerary.customers?.name || 'Not assigned'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>
              {itinerary.duration ? `${itinerary.duration} days` : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dates:</Text>
            <Text style={styles.infoValue}>
              {itinerary.start_date && itinerary.end_date
                ? `${new Date(itinerary.start_date).toLocaleDateString()} - ${new Date(itinerary.end_date).toLocaleDateString()}`
                : 'No dates specified'}
            </Text>
          </View>
          
          {itinerary.budget && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Budget:</Text>
              <Text style={styles.infoValue}>₹{itinerary.budget.toLocaleString()}</Text>
            </View>
          )}
        </View>
        
        {/* Days and Activities */}
        {days.map((day: ItineraryDay) => {
          const dayActivities = activities.filter((a: any) => a.itinerary_day_id === day.id);
          
          return (
            <View key={day.id}>
              <Text style={styles.sectionTitle}>
                Day {day.day_number} {day.date ? `- ${format(new Date(day.date), 'EEEE, MMMM d, yyyy')}` : ''}
              </Text>
              
              {/* Hotel Information */}
              {day.hotel && (
                <View style={styles.hotelCard}>
                  <Text style={styles.hotelTitle}>Accommodation: {day.hotel.name}</Text>
                  <Text style={styles.hotelDetails}>{day.hotel.address}</Text>
                  <Text style={styles.hotelDetails}>{day.hotel.city}, {day.hotel.state}, {day.hotel.country}</Text>
                  <View style={styles.starRating}>
                    <Text style={styles.hotelDetails}>Rating: {day.hotel.star_category} {day.hotel.star_category === 1 ? 'Star' : 'Stars'}</Text>
                  </View>
                  {day.hotel.phone && <Text style={styles.hotelDetails}>Phone: {day.hotel.phone}</Text>}
                  {(day.room_type || day.meal_plan) && (
                    <View style={{ marginTop: 4, paddingTop: 4, borderTop: '1 solid #e0e0e0' }}>
                      {day.room_type && (
                        <Text style={styles.hotelDetails}>Room: {day.room_type}</Text>
                      )}
                      {day.meal_plan && (
                        <Text style={styles.hotelDetails}>Meal Plan: {day.meal_plan}</Text>
                      )}
                      {/* Room price is hidden from customers */}
                    </View>
                  )}
                </View>
              )}
              
              {/* Cab Type Information - Updated to include route description but hide prices */}
              {(day.route_name || day.cab_type) && (
                <View style={styles.cabTypeCard}>
                  {day.route_name ? (
                    <>
                      <Text style={styles.cabTypeText}>Route: {day.route_name}</Text>
                      {day.route_description && (
                        <Text style={styles.routeDescription}>{day.route_description}</Text>
                      )}
                      {day.cab_type ? (
                        <Text style={styles.routeDetails}>
                          Transport: {day.cab_type}
                          {day.cab_quantity > 1 && ` x${day.cab_quantity}`}
                          {/* Cab price is hidden from customers */}
                        </Text>
                      ) : (
                        <Text style={styles.routeDetails}>No transport type selected</Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.cabTypeText}>Transport Type: {getCabTypeLabel(day.cab_type || '')}</Text>
                  )}
                </View>
              )}
              
              {/* Day Notes */}
              {day.notes && (
                <View style={styles.notesCard}>
                  <Text style={styles.notesTitle}>Day Notes:</Text>
                  <Text style={styles.notesText}>{day.notes}</Text>
                </View>
              )}
              
              {dayActivities.length > 0 && dayActivities.map((activity: any) => (
                <View key={activity.id} style={styles.activityCard}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  
                  {(activity.time_start || activity.time_end) && (
                    <Text style={styles.activityTime}>
                      Time: {' '}
                      {activity.time_start && format(new Date(`2000-01-01T${activity.time_start}`), 'h:mm a')}
                      {activity.time_start && activity.time_end && " - "}
                      {activity.time_end && format(new Date(`2000-01-01T${activity.time_end}`), 'h:mm a')}
                    </Text>
                  )}
                  
                  {activity.location && (
                    <Text style={styles.activityLocation}>
                      Location: {activity.location}
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
              <Text style={{ fontSize: 8, color: '#4b5563', textAlign: 'right', marginTop: 4 }}>
                Based on {itinerary.customers.adults} {itinerary.customers.adults === 1 ? "adult" : "adults"}
              </Text>
            )}
          </View>
        </View>
        
        {/* Terms & Conditions Section */}
        {termsAndConditions.inclusions.length > 0 || termsAndConditions.exclusions.length > 0 || termsAndConditions.terms.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            
            {/* Inclusions */}
            {termsAndConditions.inclusions.length > 0 && (
              <View style={styles.termsSection}>
                <Text style={styles.termsSubtitle}>Inclusions:</Text>
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
                <Text style={styles.termsSubtitle}>Exclusions:</Text>
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
                <Text style={styles.termsSubtitle}>Terms & Conditions:</Text>
                {termsAndConditions.terms.map((term, index) => (
                  <View key={index} style={styles.termsItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.termsText}>{term}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : null}
        
        {/* Notes */}
        {itinerary.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 10, lineHeight: 1.5 }}>{itinerary.notes}</Text>
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

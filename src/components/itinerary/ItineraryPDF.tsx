import React from 'react';
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

interface ItineraryPDFProps {
  itinerary: any;
  days: any[];
  activities: any[];
  companySettings?: CompanySettings;
  avatarUrl?: string | null;
}

// PDF component
const ItineraryPDF: React.FC<ItineraryPDFProps> = ({ itinerary, days, activities, companySettings, avatarUrl }) => {
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
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "luxury", label: "Luxury Car" },
    { value: "minivan", label: "Minivan" },
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
                    <Text style={styles.hotelDetails}>Rating: </Text>
                    {Array(day.hotel.star_category).fill(0).map((_, i) => (
                      <Text key={i} style={styles.star}>★</Text>
                    ))}
                  </View>
                  {day.hotel.phone && <Text style={styles.hotelDetails}>Phone: {day.hotel.phone}</Text>}
                </View>
              )}
              
              {/* Cab Type Information */}
              {day.cab_type && (
                <View style={styles.cabTypeCard}>
                  <Text style={styles.cabTypeText}>Transport Type: {getCabTypeLabel(day.cab_type)}</Text>
                </View>
              )}
              
              {dayActivities.length === 0 ? (
                <Text style={{ fontSize: 10, fontStyle: 'italic', marginBottom: 10 }}>
                  No activities planned for this day.
                </Text>
              ) : (
                dayActivities.map((activity: any) => (
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
                ))
              )}
            </View>
          );
        })}
        
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

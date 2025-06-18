import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
  ]
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  companyLogo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  companyPlaceholder: {
    width: 120,
    height: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  companyInfo: {
    marginTop: 10,
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2F855A', // Emerald-600
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
    color: '#2F855A', // Emerald-600
  },
  label: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    marginBottom: 10,
  },
  infoSection: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2F855A', // Emerald-600
    color: '#ffffff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 5,
  },
  tableHeaderCell: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
    fontSize: 12,
  },
  tableCell: {
    flex: 1,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    fontSize: 10,
    color: '#666666',
  },
  confirmedStatus: {
    color: '#ffffff',
    backgroundColor: '#10B981', // Emerald-500
    padding: '4 8',
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  pendingStatus: {
    color: '#ffffff',
    backgroundColor: '#F59E0B', // Amber-500
    padding: '4 8',
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  cancelledStatus: {
    color: '#ffffff',
    backgroundColor: '#EF4444', // Red-500
    padding: '4 8',
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  itineraryItem: {
    borderLeftWidth: 2,
    borderLeftColor: '#2F855A',
    paddingLeft: 10,
    marginBottom: 10,
  },
  terms: {
    fontSize: 10,
    color: '#666666',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f7f7f7',
    borderRadius: 5,
  },
});

interface CompanySettings {
  name: string;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

export interface BookingItineraryProps {
  booking: {
    id: string;
    booking_number?: string;
    customers?: {
      name: string;
      email?: string;
      phone?: string;
    } | null;
    itineraries?: {
      name: string;
      description?: string;
      duration?: number;
      destination?: string;
    } | null;
    total_amount: number;
    status: string;
    start_date?: string | null;
    end_date?: string | null;
    created_at?: string;
    notes?: string;
    itinerary?: Array<{
      day: number;
      title: string;
      description: string;
    }> | null;
  };
  companySettings?: CompanySettings;
}

const BookingItinerary: React.FC<BookingItineraryProps> = ({ booking, companySettings }) => {
  const formatBookingId = (id: string) => {
    return booking.booking_number || `BOOK${id.slice(-6).toUpperCase()}`;
  };

  // Generate mock itinerary if not provided
  const itinerary = booking.itinerary || [
    {
      day: 1,
      title: 'Arrival and Welcome',
      description: 'Airport pickup and transfer to hotel. Welcome dinner in the evening.'
    },
    {
      day: 2,
      title: 'City Tour',
      description: 'Full day guided tour of the main attractions and landmarks.'
    },
    {
      day: 3,
      title: 'Leisure Day',
      description: 'Free day for shopping and personal activities. Optional excursions available.'
    }
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {companySettings?.logo_url ? (
              <Image src={companySettings.logo_url} style={styles.companyLogo} />
            ) : (
              <View style={styles.companyPlaceholder}>
                <Text>{companySettings?.name?.substring(0, 1) || 'T'}</Text>
              </View>
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{companySettings?.name || 'Triptics Travel'}</Text>
            <Text style={{ fontSize: 10, marginTop: 5 }}>{companySettings?.address || '123 Travel Street, City, Country'}</Text>
            <Text style={{ fontSize: 10 }}>{companySettings?.phone || '+1 234 567 8900'}</Text>
            <Text style={{ fontSize: 10 }}>{companySettings?.email || 'info@triptics.example.com'}</Text>
            <Text style={{ fontSize: 10 }}>{companySettings?.website || 'www.triptics.example.com'}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Booking Confirmation</Text>
        
        {/* Status */}
        <View style={{ marginBottom: 15 }}>
          <Text style={
            booking.status === 'Confirmed' ? styles.confirmedStatus :
            booking.status === 'Pending' ? styles.pendingStatus :
            styles.cancelledStatus
          }>
            {booking.status}
          </Text>
        </View>

        {/* Booking Info */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>BOOKING ID</Text>
            <Text style={styles.value}>{formatBookingId(booking.id)}</Text>
            
            <Text style={styles.label}>BOOKING DATE</Text>
            <Text style={styles.value}>
              {booking.created_at 
                ? format(new Date(booking.created_at), "MMMM d, yyyy") 
                : format(new Date(), "MMMM d, yyyy")}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>CUSTOMER</Text>
            <Text style={styles.value}>{booking.customers?.name || 'Guest'}</Text>
            
            <Text style={styles.label}>CONTACT</Text>
            <Text style={styles.value}>
              {booking.customers?.email || 'N/A'}{booking.customers?.phone ? ` | ${booking.customers.phone}` : ''}
            </Text>
          </View>
        </View>

        {/* Itinerary Details */}
        <View style={styles.infoSection}>
          <Text style={styles.subtitle}>Itinerary Details</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>ITINERARY NAME</Text>
              <Text style={styles.value}>{booking.itineraries?.name || 'Custom Itinerary'}</Text>
              
              <Text style={styles.label}>DESTINATION</Text>
              <Text style={styles.value}>{booking.itineraries?.destination || 'Multiple Destinations'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>DURATION</Text>
              <Text style={styles.value}>{booking.itineraries?.duration || '3'} Days</Text>
              
              <Text style={styles.label}>TRAVEL DATES</Text>
              <Text style={styles.value}>
                {booking.start_date 
                  ? `${format(new Date(booking.start_date), "MMM d, yyyy")} - ${booking.end_date ? format(new Date(booking.end_date), "MMM d, yyyy") : 'TBD'}`
                  : 'To be determined'}
              </Text>
            </View>
          </View>
        </View>

        {/* Itinerary Description */}
        {booking.itineraries?.description && (
          <View style={styles.infoSection}>
            <Text style={styles.subtitle}>Description</Text>
            <Text style={styles.value}>{booking.itineraries.description}</Text>
          </View>
        )}

        {/* Itinerary */}
        <View style={styles.infoSection}>
          <Text style={styles.subtitle}>Itinerary Overview</Text>
          {itinerary.map((item, index) => (
            <View key={index} style={styles.itineraryItem}>
              <Text style={{ fontWeight: 'bold', fontSize: 12 }}>Day {item.day}: {item.title}</Text>
              <Text style={{ fontSize: 10, marginTop: 3 }}>{item.description}</Text>
            </View>
          ))}
        </View>

        {/* Payment Details */}
        <View style={styles.infoSection}>
          <Text style={styles.subtitle}>Payment Details</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Description</Text>
              <Text style={[styles.tableHeaderCell, { textAlign: 'right' }]}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>{booking.itineraries?.name || 'Itinerary Package'}</Text>
              <Text style={[styles.tableCell, { textAlign: 'right' }]}>₹{booking.total_amount.toLocaleString()}</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0, fontWeight: 'bold' }]}>
              <Text style={styles.tableCell}>Total</Text>
              <Text style={[styles.tableCell, { textAlign: 'right' }]}>₹{booking.total_amount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={styles.infoSection}>
            <Text style={styles.subtitle}>Additional Notes</Text>
            <Text style={styles.value}>{booking.notes}</Text>
          </View>
        )}

        {/* Terms and Conditions */}
        <View style={styles.terms}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Terms and Conditions:</Text>
          <Text>• Cancellation policy: Free cancellation up to 48 hours before the tour. 50% charge for cancellations within 48 hours.</Text>
          <Text>• Please arrive 15 minutes before the scheduled departure time.</Text>
          <Text>• Tour itinerary may be subject to change due to weather conditions or unforeseen circumstances.</Text>
          <Text>• Please carry a valid ID proof during the tour.</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for choosing {companySettings?.name || 'Triptics Travel'}! We look forward to providing you with an exceptional experience.</Text>
          <Text style={{ marginTop: 5 }}>For any queries, please contact us at {companySettings?.email || 'info@triptics.example.com'} or {companySettings?.phone || '+1 234 567 8900'}.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default BookingItinerary; 
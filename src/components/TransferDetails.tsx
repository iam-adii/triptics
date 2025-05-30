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
  companyInfo: {
    textAlign: 'right',
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#16a34a', // emerald-600
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#16a34a', // emerald-600
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 35,
  },
  tableRowHeader: {
    backgroundColor: '#f3f4f6',
  },
  tableCol: {
    padding: 8,
  },
  tableColHeader: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableCell: {
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  col: {
    flexGrow: 1,
  },
  label: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  value: {
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
});

// TransferDetails PDF component
const TransferDetails = ({ transfer, companySettings }: any) => {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  // Format phone number
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    // Format the phone number with proper spacing
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with company info */}
        <View style={styles.header}>
          <View>
            {companySettings?.logo ? (
              <Image src={companySettings.logo} style={styles.companyLogo} />
            ) : (
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#16a34a' }}>
                {companySettings?.name || 'Triptics Travel'}
              </Text>
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text>{companySettings?.name || 'Triptics Travel'}</Text>
            <Text>{companySettings?.address || ''}</Text>
            <Text>{companySettings?.phone || ''}</Text>
            <Text>{companySettings?.email || ''}</Text>
            <Text>{companySettings?.website || ''}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Transfer Details</Text>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <View style={[styles.tableCol, { width: '30%' }]}>
                <Text style={styles.tableColHeader}>Name</Text>
              </View>
              <View style={[styles.tableCol, { width: '40%' }]}>
                <Text style={styles.tableColHeader}>Email</Text>
              </View>
              <View style={[styles.tableCol, { width: '30%' }]}>
                <Text style={styles.tableColHeader}>Phone</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '30%' }]}>
                <Text style={styles.tableCell}>{transfer.customers?.name || 'N/A'}</Text>
              </View>
              <View style={[styles.tableCol, { width: '40%' }]}>
                <Text style={styles.tableCell}>{transfer.customers?.email || 'N/A'}</Text>
              </View>
              <View style={[styles.tableCol, { width: '30%' }]}>
                <Text style={styles.tableCell}>{formatPhone(transfer.customers?.phone) || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transfer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transfer Details</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Vehicle Type</Text>
              <Text style={styles.value}>{transfer.vehicle_type || 'N/A'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Vehicle Number</Text>
              <Text style={styles.value}>{transfer.vehicle_number || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Pickup Location</Text>
              <Text style={styles.value}>{transfer.pickup_location || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Drop Location</Text>
              <Text style={styles.value}>{transfer.drop_location || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Pickup Date & Time</Text>
              <Text style={styles.value}>
                {formatDate(transfer.pickup_datetime)} at {formatTime(transfer.pickup_datetime)}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Driver Name</Text>
              <Text style={styles.value}>{transfer.driver_name || 'N/A'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Driver Contact</Text>
              <Text style={styles.value}>{formatPhone(transfer.driver_contact) || 'N/A'}</Text>
            </View>
          </View>

          {transfer.notes && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Notes</Text>
                <Text style={styles.value}>{transfer.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Terms and Conditions (optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms and Conditions</Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>
            1. Please be ready at the pickup location 10 minutes before the scheduled time.
          </Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>
            2. Changes to the booking must be made at least 6 hours before the scheduled time.
          </Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>
            3. In case of cancellation, please contact the driver or our customer service.
          </Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>
            4. The transfer service includes the vehicle, driver, and fuel cost.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {companySettings?.name || 'Triptics Travel'} • Generated on {format(new Date(), 'MMMM d, yyyy')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default TransferDetails; 
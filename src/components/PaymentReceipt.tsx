import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontStyle: 'italic' },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Roboto',
  },
  section: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
    borderBottomStyle: 'solid',
    paddingBottom: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
    objectFit: 'contain',
  },
  companyDetails: {
    width: '60%',
    flexDirection: 'column',
  },
  receiptDetails: {
    width: '40%',
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  companyTagline: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#64748B',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 2,
  },
  companyContact: {
    fontSize: 9,
    color: '#64748B',
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#10B981',
  },
  receiptNumber: {
    fontSize: 10,
    marginBottom: 5,
    color: '#334155',
  },
  receiptDate: {
    fontSize: 10,
    color: '#64748B',
  },
  customerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 10,
    marginBottom: 2,
  },
  customerDetails: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 2,
  },
  paymentDetails: {
    marginBottom: 20,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  paymentLabel: {
    fontSize: 10,
    width: '30%',
    color: '#64748B',
  },
  paymentValue: {
    fontSize: 10,
    width: '70%',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'solid',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    backgroundColor: '#F8FAFC',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: 8,
    color: '#334155',
  },
  tableCell: {
    fontSize: 10,
    padding: 8,
  },
  col1: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    borderRightStyle: 'solid',
  },
  col2: {
    width: '25%',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    borderRightStyle: 'solid',
    textAlign: 'center',
  },
  col3: {
    width: '25%',
    textAlign: 'right',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: '20%',
    textAlign: 'right',
    marginRight: 10,
  },
  summaryValue: {
    fontSize: 10,
    width: '15%',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#10B981',
    borderTopStyle: 'solid',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '20%',
    textAlign: 'right',
    marginRight: 10,
    color: '#10B981',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '15%',
    textAlign: 'right',
    color: '#10B981',
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderTopStyle: 'solid',
    paddingTop: 15,
  },
  thankYou: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 5,
  },
  watermark: {
    position: 'absolute',
    fontSize: 70,
    color: 'rgba(16, 185, 129, 0.03)',
    transform: 'rotate(-45deg)',
    left: 170,
    top: 350,
  },
  status: {
    position: 'absolute',
    fontSize: 40,
    fontWeight: 'bold',
    color: 'rgba(16, 185, 129, 0.15)',
    transform: 'rotate(-20deg)',
    right: 50,
    top: 150,
  },
});

interface Customer {
  name: string;
  email?: string;
  phone?: string;
}

interface Booking {
  id: string;
  customers?: Customer | null;
  total_amount?: number;
  tours?: {
    id: string;
    name: string;
    location?: string;
  } | null;
  start_date?: string;
  end_date?: string;
}

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

interface PaymentReceiptProps {
  payment: {
    id: string;
    payment_id: string;
    amount: number;
    status: string;
    payment_method: string;
    payment_date: string;
    payment_type?: string;
    notes?: string;
    bookings?: Booking | null;
  };
  showPaid?: boolean;
  companySettings?: CompanySettings;
  avatarUrl?: string | null;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ payment, showPaid = true, companySettings, avatarUrl }) => {
  // Format currency function
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Use provided company settings or fallback to defaults
  const company = companySettings || {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark for status */}
        {showPaid && payment.status === 'Completed' && (
          <Text style={styles.status}>PAID</Text>
        )}

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.companyDetails}>
            {hasAvatar && (
              <Image 
                src={avatarUrl || ''} 
                style={styles.logo} 
              />
            )}
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyAddress}>{company.address}</Text>
            <Text style={styles.companyContact}>
              {company.phone && `${company.phone}`}
              {company.phone && company.email && " | "}
              {company.email && `${company.email}`}
            </Text>
            <Text style={styles.companyContact}>
              {company.website && `${company.website}`}
              {company.website && company.gstin && " | "}
              {company.gstin && `GSTIN: ${company.gstin}`}
            </Text>
          </View>
          <View style={styles.receiptDetails}>
            <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
            <Text style={styles.receiptNumber}>Receipt No: {payment.payment_id}</Text>
            <Text style={styles.receiptDate}>Date: {formatDate(payment.payment_date)}</Text>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>BILL TO</Text>
          <Text style={styles.customerName}>{payment.bookings?.customers?.name || 'Customer'}</Text>
          {payment.bookings?.customers?.email && (
            <Text style={styles.customerDetails}>{payment.bookings.customers.email}</Text>
          )}
          {payment.bookings?.customers?.phone && (
            <Text style={styles.customerDetails}>{payment.bookings.customers.phone}</Text>
          )}
        </View>

        {/* Payment Details */}
        <View style={styles.paymentDetails}>
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
          
          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentLabel}>Payment Method:</Text>
            <Text style={styles.paymentValue}>{payment.payment_method}</Text>
          </View>
          
          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentLabel}>Payment Type:</Text>
            <Text style={styles.paymentValue}>{payment.payment_type || "Full"}</Text>
          </View>
          
          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentLabel}>Payment Status:</Text>
            <Text style={styles.paymentValue}>{payment.status}</Text>
          </View>
          
          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentLabel}>Payment Date:</Text>
            <Text style={styles.paymentValue}>{formatDate(payment.payment_date)}</Text>
          </View>
          
          {payment.bookings?.id && (
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentLabel}>Booking Reference:</Text>
              <Text style={styles.paymentValue}>{payment.bookings.id}</Text>
            </View>
          )}
        </View>

        {/* Payment Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Status</Text>
            <Text style={[styles.tableHeaderCell, styles.col3]}>Amount</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.col1]}>
              {payment.bookings && payment.bookings.tours ? 
                `${payment.bookings.tours.name}${payment.bookings.tours.location ? ` - ${payment.bookings.tours.location}` : ''}\n` +
                `${payment.bookings.start_date && payment.bookings.end_date ? 
                  `Tour dates: ${formatDate(payment.bookings.start_date)} - ${formatDate(payment.bookings.end_date)}` : 
                  ''}`
                : 
                `Payment for ${payment.bookings ? 'Booking' : 'Services'}`
              }
              {payment.notes && `\n${payment.notes}`}
            </Text>
            <Text style={[styles.tableCell, styles.col2]}>{payment.status}</Text>
            <Text style={[styles.tableCell, styles.col3]}>{formatCurrency(payment.amount)}</Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(payment.amount)}</Text>
        </View>
        
        {/* If we had taxes or other fees, we would add them here */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(payment.amount)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thankYou}>Thank you for your business!</Text>
          <Text style={styles.footerText}>This is a computer-generated receipt and does not require a physical signature.</Text>
          <Text style={styles.footerText}>For any questions regarding this receipt, please contact our support team.</Text>
          <Text style={styles.footerText}>
            {company.name}
            {company.phone && ` • ${company.phone}`}
            {company.email && ` • ${company.email}`}
            {company.website && ` • ${company.website}`}
            {company.gstin && ` • GSTIN: ${company.gstin}`}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PaymentReceipt; 
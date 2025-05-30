/**
 * Email Configuration
 * This file contains the configuration for email functionality
 */

// Environment-specific configuration
const isDevelopment = import.meta.env.MODE === 'development';

// Email API base URL
export const EMAIL_API_URL = isDevelopment 
  ? 'http://localhost:3001/api'
  : 'https://api.yourdomain.com/email/api'; // Change this in production

// Email API endpoints
export const EMAIL_ENDPOINTS = {
  test: '/email/test',
  send: '/email/send',
  bookingConfirmation: '/email/booking-confirmation',
  paymentReceipt: '/email/payment-receipt',
  transferDetails: '/email/transfer-details',
  itinerary: '/email/itinerary'
};

// Default email settings (used as placeholders)
export const DEFAULT_EMAIL_SETTINGS = {
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  sender_name: 'Triptics Travel',
  sender_email: 'noreply@example.com'
};

// Email templates (can be extended in the future)
export const EMAIL_TEMPLATES = {
  bookingConfirmation: {
    subject: 'Booking Confirmation - {bookingId}',
    text: 'Dear Customer,\n\nYour booking has been confirmed. Please find the attached itinerary details.\n\nBooking ID: {bookingId}\nBooking Date: {bookingDate}\n\nThank you for choosing our services.'
  },
  paymentReceipt: {
    subject: 'Payment Receipt - {paymentId}',
    text: 'Dear Customer,\n\nWe confirm receipt of your payment. Please find the attached invoice.\n\nPayment ID: {paymentId}\nAmount: {amount}\nDate: {date}\n\nThank you for your payment.'
  },
  transferDetails: {
    subject: 'Transfer Confirmation - {transferId}',
    text: 'Dear {customerName},\n\nYour transfer has been confirmed. Please find the attached details for your upcoming transfer.\n\nVehicle: {vehicleType} - {vehicleNumber}\nPickup: {pickupLocation}\nDrop: {dropLocation}\nDate & Time: {dateTime}\nDriver: {driverName} ({driverContact})\n\nThank you for choosing our services.'
  }
}; 
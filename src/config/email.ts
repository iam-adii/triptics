/**
 * Email service configuration
 */

// Email server endpoints
export const EMAIL_ENDPOINTS = {
  contact: '/api/send-email.php',
  check: '/api/send-email.php?check=true',
  transfer: '/api/send-email.php?type=transfer',
  itinerary: '/api/send-email.php?type=itinerary',
  payment: '/api/send-email.php?type=payment',
  test_smtp: '/api/test-smtp.php'
};

// Email types
export const EMAIL_TYPES = {
  TRANSFER: 'transfer',
  ITINERARY: 'itinerary',
  CONTACT: 'contact',
  PAYMENT: 'payment',
};

// Default email settings
export const DEFAULT_EMAIL_SETTINGS = {
  fromName: 'Your Company Name',
  fromEmail: 'no-reply@example.com',
  subject: 'New Message',
}; 
/**
 * Browser shim for nodemailer
 * Provides mock implementations of nodemailer functions for browser environments
 */

// Mock nodemailer in browser
export default {
  createTransport: () => ({
    sendMail: async () => ({
      messageId: 'browser-mock-' + Date.now()
    })
  })
}; 
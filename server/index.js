const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware - Configure CORS to allow requests from any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Email settings cache (to avoid unnecessary database queries)
let emailSettingsCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Endpoint to test if the server is running
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Email server is running' });
});

// Endpoint to send a test email
app.post('/api/email/test', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || !settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email settings not configured properly' 
      });
    }

    // Create a test transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password,
      },
    });

    // Send a test email
    const info = await transporter.sendMail({
      from: `"${settings.sender_name}" <${settings.sender_email}>`,
      to: settings.sender_email,
      subject: 'Test Email - SMTP Configuration',
      text: 'This is a test email to verify your SMTP configuration is working correctly.',
      html: '<div><h2>Test Email</h2><p>This is a test email to verify your SMTP configuration is working correctly.</p></div>'
    });

    res.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email'
    });
  }
});

// Endpoint to send email
app.post('/api/email/send', async (req, res) => {
  try {
    const { to, subject, text, html, attachments, settings } = req.body;
    
    if (!settings || !settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email settings not configured properly' 
      });
    }

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required email fields (to, subject, text/html)'
      });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${settings.sender_name}" <${settings.sender_email}>`,
      to,
      subject,
      text,
      html: html || text,
      attachments
    });

    res.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
});

// Endpoint to send booking confirmation email
app.post('/api/email/booking-confirmation', async (req, res) => {
  try {
    const { to, bookingDetails, pdfBuffer, settings } = req.body;
    
    if (!settings || !to || !bookingDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (settings, to, bookingDetails)'
      });
    }

    // Create the email content
    const subject = `Booking Confirmation - ${bookingDetails.bookingId || 'New Booking'}`;
    const text = `Dear Customer,\n\nYour booking has been confirmed. Please find the attached itinerary details.\n\nBooking ID: ${bookingDetails.bookingId}\nBooking Date: ${bookingDetails.bookingDate}\n\nThank you for choosing our services.`;
    const html = `
      <div>
        <h2>Booking Confirmation</h2>
        <p>Dear Customer,</p>
        <p>Your booking has been confirmed. Please find the attached itinerary details.</p>
        <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
        <p><strong>Booking Date:</strong> ${bookingDetails.bookingDate}</p>
        <p>Thank you for choosing our services.</p>
      </div>
    `;
    
    // Create attachments array if there is a PDF buffer
    const attachments = pdfBuffer ? [{
      filename: `itinerary-${bookingDetails.bookingId}.pdf`,
      content: Buffer.from(pdfBuffer),
      contentType: 'application/pdf'
    }] : [];

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${settings.sender_name}" <${settings.sender_email}>`,
      to,
      subject,
      text,
      html,
      attachments
    });

    res.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send booking confirmation email'
    });
  }
});

// Endpoint to send payment receipt email
app.post('/api/email/payment-receipt', async (req, res) => {
  try {
    const { to, paymentDetails, pdfBuffer, settings } = req.body;
    
    if (!settings || !to || !paymentDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (settings, to, paymentDetails)'
      });
    }

    // Create the email content
    const subject = `Payment Receipt - ${paymentDetails.paymentId || 'Payment'}`;
    const text = `Dear Customer,\n\nWe confirm receipt of your payment. Please find the attached invoice.\n\nPayment ID: ${paymentDetails.paymentId}\nAmount: ${paymentDetails.amount}\nDate: ${paymentDetails.date}\n\nThank you for your payment.`;
    const html = `
      <div>
        <h2>Payment Receipt</h2>
        <p>Dear Customer,</p>
        <p>We confirm receipt of your payment. Please find the attached invoice.</p>
        <p><strong>Payment ID:</strong> ${paymentDetails.paymentId}</p>
        <p><strong>Amount:</strong> ${paymentDetails.amount}</p>
        <p><strong>Date:</strong> ${paymentDetails.date}</p>
        <p>Thank you for your payment.</p>
      </div>
    `;
    
    // Create attachments array if there is a PDF buffer
    const attachments = pdfBuffer ? [{
      filename: `receipt-${paymentDetails.paymentId}.pdf`,
      content: Buffer.from(pdfBuffer),
      contentType: 'application/pdf'
    }] : [];

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${settings.sender_name}" <${settings.sender_email}>`,
      to,
      subject,
      text,
      html,
      attachments
    });

    res.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending payment receipt email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send payment receipt email'
    });
  }
});

// Endpoint to send transfer details email
app.post('/api/email/transfer-details', async (req, res) => {
  try {
    console.log('Received request to /api/email/transfer-details');
    const { to, transferDetails, pdfBuffer, settings } = req.body;
    
    console.log('Request body has properties:', Object.keys(req.body));
    console.log('To:', to);
    console.log('Transfer details present:', !!transferDetails);
    console.log('PDF buffer present:', !!pdfBuffer);
    console.log('Settings present:', !!settings);
    
    if (!settings || !to || !transferDetails) {
      console.log('Missing required fields, returning 400');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (settings, to, transferDetails)'
      });
    }

    // Create the email content
    const subject = `Transfer Confirmation - ${transferDetails.transferId || 'Transfer'}`;
    const text = `Dear ${transferDetails.customerName || 'Customer'},

Your transfer has been confirmed. Please find the attached details for your upcoming transfer.

Vehicle: ${transferDetails.vehicleType} - ${transferDetails.vehicleNumber}
Pickup: ${transferDetails.pickupLocation}
Drop: ${transferDetails.dropLocation}
Date & Time: ${transferDetails.dateTime}
Driver: ${transferDetails.driverName} (${transferDetails.driverContact})

Thank you for choosing our services.`;

    const html = `
      <div>
        <h2>Transfer Confirmation</h2>
        <p>Dear ${transferDetails.customerName || 'Customer'},</p>
        <p>Your transfer has been confirmed. Please find the attached details for your upcoming transfer.</p>
        <p><strong>Vehicle:</strong> ${transferDetails.vehicleType} - ${transferDetails.vehicleNumber}</p>
        <p><strong>Pickup:</strong> ${transferDetails.pickupLocation}</p>
        <p><strong>Drop:</strong> ${transferDetails.dropLocation}</p>
        <p><strong>Date & Time:</strong> ${transferDetails.dateTime}</p>
        <p><strong>Driver:</strong> ${transferDetails.driverName} (${transferDetails.driverContact})</p>
        <p>Thank you for choosing our services.</p>
      </div>
    `;
    
    // Create attachments array if there is a PDF buffer
    const attachments = pdfBuffer ? [{
      filename: `transfer-${transferDetails.transferId}.pdf`,
      content: Buffer.from(pdfBuffer),
      contentType: 'application/pdf'
    }] : [];

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${settings.sender_name}" <${settings.sender_email}>`,
      to,
      subject,
      text,
      html,
      attachments
    });

    res.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending transfer details email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send transfer details email'
    });
  }
});

// Endpoint for sending itinerary email with PDF attachment
app.post('/api/email/itinerary', async (req, res) => {
  console.log('Received request to send itinerary email');
  
  try {
    const { recipient, itineraryDetails, settings, pdfBuffer } = req.body;
    
    if (!recipient) {
      console.error('Missing recipient email');
      return res.status(400).json({ error: 'Missing recipient email' });
    }
    
    if (!itineraryDetails) {
      console.error('Missing itinerary details');
      return res.status(400).json({ error: 'Missing itinerary details' });
    }
    
    if (!settings) {
      console.error('Missing email settings');
      return res.status(400).json({ error: 'Missing email settings' });
    }
    
    console.log('Recipient:', recipient);
    console.log('Preparing email for itinerary:', itineraryDetails.itineraryName);
    
    // Create email content with styled HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">${itineraryDetails.itineraryName}</h1>
        <p>Dear ${itineraryDetails.customerName},</p>
        <p>We are pleased to share your travel itinerary with you.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Destination:</strong> ${itineraryDetails.destination}</p>
          <p><strong>Travel Dates:</strong> ${itineraryDetails.startDate} to ${itineraryDetails.endDate}</p>
        </div>
        
        <p>Please find your detailed itinerary attached to this email as a PDF.</p>
        
        <p>If you have any questions or need any changes, please don't hesitate to contact us.</p>
        
        <p>We look forward to making your trip memorable!</p>
        
        <p>Best regards,<br>${settings.sender_name || 'Your Travel Team'}</p>
      </div>
    `;
    
    // Set up email transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password
      }
    });
    
    // Prepare attachments array
    let attachments = [];
    
    // Add PDF attachment if buffer is provided
    if (pdfBuffer && pdfBuffer.length > 0) {
      console.log('Processing PDF attachment, buffer length:', pdfBuffer.length);
      
      try {
        // Convert the array back to Buffer
        const pdfData = Buffer.from(pdfBuffer);
        
        // Create PDF attachment
        attachments.push({
          filename: `${itineraryDetails.itineraryName.replace(/\s+/g, '_')}_Itinerary.pdf`,
          content: pdfData,
          contentType: 'application/pdf',
          contentDisposition: 'attachment' // Force attachment
        });
        
        console.log('PDF attachment created successfully');
      } catch (pdfError) {
        console.error('Error processing PDF buffer:', pdfError);
      }
    } else {
      console.log('No PDF attachment: Buffer not provided or empty');
    }
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"${settings.sender_name}" <${settings.sender_email}>`,
      to: recipient,
      subject: `Your Travel Itinerary: ${itineraryDetails.itineraryName}`,
      text: `Your travel itinerary for ${itineraryDetails.destination} from ${itineraryDetails.startDate} to ${itineraryDetails.endDate} is attached.`,
      html: emailHtml,
      attachments: attachments
    });
    
    console.log(`Itinerary email sent successfully: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
    
  } catch (error) {
    console.error('Error sending itinerary email:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Email server running on port ${port}`);
}); 
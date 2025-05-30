# Triptics Email Server

This is a simple Express server that handles email sending for the Triptics application using nodemailer with cPanel SMTP settings.

## Setup

1. Install dependencies:
   ```
   cd server
   npm install
   ```

2. Create a `.env` file in the server directory with the following content:
   ```
   # Server configuration
   PORT=3001

   # CORS settings
   CORS_ORIGIN=http://localhost:8080
   ```

3. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Test Server
- `GET /api/status` - Check if the server is running

### Email Operations
- `POST /api/email/test` - Test email settings
- `POST /api/email/send` - Send a basic email
- `POST /api/email/booking-confirmation` - Send a booking confirmation email with PDF attachment
- `POST /api/email/payment-receipt` - Send a payment receipt email with PDF attachment

## cPanel SMTP Configuration

To use cPanel SMTP with this server, you need to provide the following SMTP settings in your requests:

```json
{
  "settings": {
    "smtp_host": "mail.yourdomain.com",
    "smtp_port": 587,
    "smtp_user": "noreply@yourdomain.com",
    "smtp_password": "your-secure-password",
    "sender_name": "Your Company Name",
    "sender_email": "noreply@yourdomain.com"
  }
}
```

These settings are stored in the Supabase database and can be configured through the Triptics application settings page.

## Deployment

For production deployment, consider the following:

1. Use environment variables for configuration
2. Set up HTTPS for secure communication
3. Implement rate limiting to prevent abuse
4. Add authentication for API endpoints
5. Consider using a process manager like PM2 to keep the server running

Example PM2 configuration:
```
pm2 start index.js --name "triptics-email-server"
```

## Security Considerations

- This server handles sensitive email credentials, ensure it's properly secured
- All communication should be over HTTPS in production
- Implement proper authentication for API access
- Store sensitive data like SMTP passwords securely
- Validate all incoming requests thoroughly 
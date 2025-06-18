# Triptics API Server

This is a comprehensive Node.js API server for the Triptics application, providing authentication, email services, and more.

## Features

- User authentication with JWT
- Email sending with SMTP
- Supabase integration
- Rate limiting
- Error handling
- Security features (CORS, Helmet)
- TypeScript support

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
   NODE_ENV=development

   # CORS settings
   CORS_ORIGIN=http://localhost:5173

   # JWT Secret
   JWT_SECRET=your-secret-key-change-in-production

   # Supabase configuration
   SUPABASE_URL=https://your-project-url.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   ```

3. Build the TypeScript code:
   ```
   npm run build
   ```

4. Start the server:
   ```
   npm run dev   # For development with auto-reload
   npm start     # For production
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/register` - Register a new user
- `GET /api/auth/profile` - Get current user profile (requires authentication)

### Email Operations
- `GET /api/email/status` - Check if the server is running
- `POST /api/email/test` - Test email settings
- `POST /api/email/send` - Send a basic email
- `POST /api/email/booking-confirmation` - Send a booking confirmation email with PDF attachment
- `GET /api/email/settings` - Get email settings (requires authentication)
- `POST /api/email/settings` - Save email settings (requires authentication)

## Supabase Integration

This server integrates with Supabase for:
1. User authentication
2. Data storage
3. Email settings management

Make sure to set up the following tables in your Supabase project:

### Email Settings Table
```sql
CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_user TEXT NOT NULL,
  smtp_password TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  secure_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Deployment

For production deployment, consider the following:

1. Set NODE_ENV=production in your environment
2. Use a process manager like PM2 to keep the server running
3. Set up HTTPS for secure communication
4. Use a strong JWT secret
5. Configure proper CORS settings

Example PM2 configuration:
```
pm2 start dist/index.js --name "triptics-api"
```

## Security Considerations

- All API endpoints are rate-limited to prevent abuse
- Authentication is required for sensitive operations
- CORS is configured to restrict access to allowed origins
- Helmet is used to set security headers
- Error messages are sanitized in production mode 
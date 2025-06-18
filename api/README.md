# PHPMailer Setup

This directory contains the necessary files to set up PHPMailer for sending emails from your React+Vite application.

## Files Structure

- `send-email.php`: Main file that handles email sending requests
- `config.php`: Configuration file for email settings
- `rate-limit.php`: Simple rate limiting functionality to prevent abuse
- `index.php`: Simple info page and directory access protection
- `.htaccess`: Apache configuration for security and CORS
- `composer.json`: Dependency management for PHPMailer

## Setup Instructions

1. Install Composer if you don't have it already: [https://getcomposer.org/download/](https://getcomposer.org/download/)

2. Navigate to the `api` directory and run:
   ```
   composer install
   ```

3. Edit the `config.php` file to configure your SMTP settings:
   - Replace `smtp.example.com` with your SMTP server
   - Replace `your-email@example.com` with your email address
   - Replace `your-password` with your email password or app password
   - Replace `recipient@example.com` with the recipient's email address
   - Update the allowed origins to match your domain

4. Make sure your hosting environment supports PHP (version 7.4 or higher recommended) and has the necessary extensions enabled.

5. Ensure the `api` directory is accessible from your frontend (typically at the same level as your index.html).

## Deployment

1. Upload the entire `api` directory to your web server.

2. Make sure the server has write permissions for the `api` directory (needed for rate limiting functionality).

3. Update the CORS settings in `.htaccess` and `config.php` to match your production domain.

## Usage from React

Here's how to use the email API from your React application:

```javascript
const sendEmail = async (formData) => {
  try {
    const response = await fetch('/api/send-email.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }
    
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
```

## Security Considerations

1. Never expose your SMTP credentials in client-side code
2. Consider implementing additional security measures like CAPTCHA
3. Validate and sanitize all user inputs
4. Use environment variables for sensitive information when possible
5. Regularly update PHPMailer to the latest version

## Troubleshooting

If you encounter issues:

1. Check your SMTP settings and credentials
2. Verify that your hosting provider allows outgoing SMTP connections
3. Check server logs for PHP errors
4. Try enabling debug mode in PHPMailer for more detailed error information 
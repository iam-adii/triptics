# cPanel Deployment Guide for Triptics

This guide provides step-by-step instructions for deploying the Triptics application to a cPanel hosting environment.

## Prerequisites

1. A cPanel hosting account with:
   - PHP 7.4 or higher
   - MySQL/MariaDB database

2. FTP access or cPanel File Manager access to upload files

## Deployment Steps

### 1. Build the Application

First, build the application on your local machine:

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

This will create a `dist` folder with the compiled application.

### 2. Prepare Files for Upload

1. Make sure the `api` directory is included in your `dist` folder
2. Verify that `.htaccess` is included in your `dist` folder

### 3. Upload Files to cPanel

1. Log in to your cPanel account
2. Navigate to File Manager or use FTP to connect to your server
3. Navigate to the public_html directory (or a subdirectory if you want to deploy to a specific path)
4. Upload all files from the `dist` folder to your chosen directory

### 4. Troubleshooting

If you encounter issues:

1. **Check PHP Error Logs**:
   - In cPanel, go to "Error Log" to check for any PHP errors

2. **Check File Permissions**:
   - The `api` directory should have 755 permissions
   - PHP files should have 644 permissions

## Advanced Configuration

### Using a Subdomain for API

If you want to use a separate subdomain for the API:

1. Create a subdomain (e.g., api.yourdomain.com) in cPanel
2. Upload only the `api` directory to the subdomain's document root
3. Update the API URL in the application configuration

### SSL Configuration

It's highly recommended to use SSL for security:

1. In cPanel, go to "SSL/TLS Status"
2. Install SSL for your domain
3. Make sure all API URLs use HTTPS instead of HTTP

## Testing the Deployment

1. Navigate to your deployed application URL
2. Log in with your credentials
3. Test the core functionality of your application

## Support

If you encounter any issues with the deployment, please refer to:

1. Your hosting provider's documentation
2. cPanel documentation: https://docs.cpanel.net/ 
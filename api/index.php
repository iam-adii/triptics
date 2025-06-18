<?php
// Prevent direct access to this file
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Display a simple info page
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Service</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #2563eb;
        }
        .container {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            background-color: #10b981;
            color: white;
            font-size: 14px;
        }
        code {
            background-color: #e5e7eb;
            padding: 2px 4px;
            border-radius: 4px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Email API Service</h1>
        <p><span class="status">Active</span></p>
        
        <h2>API Endpoints</h2>
        <p>This service provides an email sending API for your application.</p>
        
        <h3>POST /send-email.php</h3>
        <p>Sends an email using the provided data.</p>
        
        <h4>Request Body</h4>
        <pre><code>{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, this is a test message."
}</code></pre>
        
        <h4>Response</h4>
        <pre><code>// Success
{
  "success": true,
  "message": "Email sent successfully"
}

// Error
{
  "error": "Error message"
}</code></pre>
        
        <p><strong>Note:</strong> Direct access to API files is restricted for security reasons.</p>
    </div>
</body>
</html> 
<?php
// Enable CORS to allow requests from your frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Set up error handling to return JSON instead of HTML
function handleError($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        'error' => 'PHP Error: ' . $errstr,
        'file' => $errfile,
        'line' => $errline
    ]);
    exit();
}
set_error_handler('handleError');

// Handle fatal errors (like class not found)
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode([
            'error' => 'PHP Fatal Error: ' . $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ]);
        exit();
    }
});

// If it's a preflight OPTIONS request, return early
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if this is a server check request
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['check'])) {
    echo json_encode(['success' => true, 'message' => 'Email server is running']);
    exit();
}

// Only allow POST requests for sending emails
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get the raw POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validate required fields
if (!isset($data['name']) || !isset($data['email']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit();
}

// Load configuration
$config = require __DIR__ . '/config.php';

// Check if custom SMTP settings are provided in the request
if (isset($data['settings']) && 
    isset($data['settings']['smtp_host']) && 
    isset($data['settings']['smtp_port']) && 
    isset($data['settings']['smtp_user']) && 
    isset($data['settings']['smtp_password']) && 
    isset($data['settings']['sender_name']) && 
    isset($data['settings']['sender_email'])) {
    
    // Override config with settings from the request
    $config['smtp']['host'] = $data['settings']['smtp_host'];
    $config['smtp']['port'] = $data['settings']['smtp_port'];
    $config['smtp']['username'] = $data['settings']['smtp_user'];
    $config['smtp']['password'] = $data['settings']['smtp_password'];
    $config['email']['from_name'] = $data['settings']['sender_name'];
    $config['email']['from_email'] = $data['settings']['sender_email'];
} else {
    // Try to fetch email settings from database
    try {
        // Connect to your database
        $dbConfig = require __DIR__ . '/db-config.php';
        $pdo = new PDO(
            "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4",
            $dbConfig['username'],
            $dbConfig['password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        // Query for email settings
        $stmt = $pdo->query("SELECT * FROM email_settings LIMIT 1");
        $emailSettings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($emailSettings) {
            // Override config with settings from database
            $config['smtp']['host'] = $emailSettings['smtp_host'];
            $config['smtp']['port'] = $emailSettings['smtp_port'];
            $config['smtp']['username'] = $emailSettings['smtp_user'];
            $config['smtp']['password'] = $emailSettings['smtp_password'];
            $config['email']['from_name'] = $emailSettings['sender_name'];
            $config['email']['from_email'] = $emailSettings['sender_email'];
        }
    } catch (Exception $e) {
        // Log the error but continue with default settings
        error_log("Error fetching email settings from database: " . $e->getMessage());
        // We'll continue with the default config settings
    }
}

// Check rate limit
require_once __DIR__ . '/rate-limit.php';
$rateLimit = new RateLimit($config);
$rateLimitCheck = $rateLimit->check();

if ($rateLimitCheck !== true) {
    http_response_code(429); // Too Many Requests
    echo json_encode(['error' => $rateLimitCheck]);
    exit();
}

// Include PHPMailer
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Create a new PHPMailer instance
$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = $config['smtp']['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['smtp']['username'];
    $mail->Password   = $config['smtp']['password'];
    $mail->SMTPSecure = $config['smtp']['encryption'] === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $config['smtp']['port'];
    
    // Enable debug mode if requested
    if (isset($_GET['debug']) && $_GET['debug'] === 'true') {
        $mail->SMTPDebug = SMTP::DEBUG_SERVER;
    }

    // Recipients
    $mail->setFrom($config['email']['from_email'], $config['email']['from_name']);
    $mail->addAddress($data['email']);
    $mail->addReplyTo($config['email']['from_email'], $config['email']['from_name']);

    // Content
    $mail->isHTML(true);
    
    // Determine email type and customize content
    $emailType = isset($_GET['type']) ? $_GET['type'] : (isset($data['type']) ? $data['type'] : 'contact');
    
    // For future database integrations
    $companyName = $config['email']['from_name']; // Default company name

    // Fetch company name from database if possible
    function fetchCompanyName($default) {
        try {
            // DB Connection settings - adjust as needed
            $host = "localhost";
            $dbname = "triptics";
            $username = "triptics_user";
            $password = "triptics_pass";
            
            // Connect to database
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Fetch company name from settings
            $stmt = $pdo->prepare("SELECT name FROM company_settings LIMIT 1");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result && isset($result['name'])) {
                return $result['name'];
            }
            
            return $default;
        } catch (PDOException $e) {
            // On error, return default name
            return $default;
        }
    }

    // Try to get company name from database or use default
    $companyName = fetchCompanyName($config['email']['from_name']);
    
    switch ($emailType) {
        case 'transfer':
            // Handle transfer email
            if (!isset($data['transferDetails'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing transfer details']);
                exit();
            }
            
            $transferDetails = $data['transferDetails'];
            $mail->Subject = "Your Transfer Details - " . $transferDetails['transferId'];
            
            // Create HTML content for transfer email
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #2563eb;'>Your Transfer Details</h2>
                    <p>Dear {$transferDetails['customerName']},</p>
                    <p>Here are the details of your upcoming transfer:</p>
                    
                    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                        <p><strong>Transfer ID:</strong> {$transferDetails['transferId']}</p>
                        <p><strong>Date & Time:</strong> {$transferDetails['dateTime']}</p>
                        <p><strong>Vehicle:</strong> {$transferDetails['vehicleType']} ({$transferDetails['vehicleNumber']})</p>
                        <p><strong>Pickup:</strong> {$transferDetails['pickupLocation']}</p>
                        <p><strong>Drop-off:</strong> {$transferDetails['dropLocation']}</p>
                        <p><strong>Driver:</strong> {$transferDetails['driverName']}</p>
                        <p><strong>Driver Contact:</strong> {$transferDetails['driverContact']}</p>
                    </div>
                    
                    <p>Please keep this information handy for your reference.</p>
                    <p>If you have any questions or need to make changes, please contact us.</p>
                    <p>Thank you for choosing our service!</p>
                    <p>Best regards,<br>{$companyName}</p>
                </div>
            ";
            
            $mail->AltBody = "
                Your Transfer Details
                
                Dear {$transferDetails['customerName']},
                
                Here are the details of your upcoming transfer:
                
                Transfer ID: {$transferDetails['transferId']}
                Date & Time: {$transferDetails['dateTime']}
                Vehicle: {$transferDetails['vehicleType']} ({$transferDetails['vehicleNumber']})
                Pickup: {$transferDetails['pickupLocation']}
                Drop-off: {$transferDetails['dropLocation']}
                Driver: {$transferDetails['driverName']}
                Driver Contact: {$transferDetails['driverContact']}
                
                Please keep this information handy for your reference.
                If you have any questions or need to make changes, please contact us.
                
                Thank you for choosing our service!
                
                Best regards,
                {$companyName}
            ";
            
            // Add PDF attachment if provided
            if (isset($data['pdfAttachment']) && isset($data['pdfAttachment']['content']) && isset($data['pdfAttachment']['filename'])) {
                $pdfContent = $data['pdfAttachment']['content'];
                $filename = $data['pdfAttachment']['filename'];
                
                // Convert array back to binary
                $pdfBinary = '';
                foreach ($pdfContent as $byte) {
                    $pdfBinary .= chr($byte);
                }
                
                // Add attachment
                $mail->addStringAttachment($pdfBinary, $filename, 'base64', 'application/pdf');
            }
            break;
            
        case 'itinerary':
            // Handle itinerary email
            if (!isset($data['itineraryDetails'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing itinerary details']);
                exit();
            }
            
            // Make sure all required fields are available with defaults
            $itineraryDetails = $data['itineraryDetails'];
            $itineraryDetails = array_merge([
                'itineraryName' => 'Your Itinerary',
                'destination' => 'Your Destination',
                'startDate' => 'Not specified',
                'endDate' => 'Not specified',
                'customerName' => 'Valued Customer'
            ], $itineraryDetails);
            
            $mail->Subject = "Your Itinerary - " . $itineraryDetails['itineraryName'];
            
            // Create HTML content for itinerary email
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #2563eb;'>Your Itinerary</h2>
                    <p>Dear {$itineraryDetails['customerName']},</p>
                    <p>Please find attached your itinerary for your upcoming trip to {$itineraryDetails['destination']}.</p>
                    
                    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                        <p><strong>Itinerary:</strong> {$itineraryDetails['itineraryName']}</p>
                        <p><strong>Destination:</strong> {$itineraryDetails['destination']}</p>
                        <p><strong>Start Date:</strong> {$itineraryDetails['startDate']}</p>
                        <p><strong>End Date:</strong> {$itineraryDetails['endDate']}</p>
                    </div>
                    
                    <p>We've attached a detailed PDF with your complete itinerary.</p>
                    <p>If you have any questions or need to make changes, please contact us.</p>
                    <p>We wish you a pleasant journey!</p>
                    <p>Best regards,<br>{$companyName}</p>
                </div>
            ";
            
            $mail->AltBody = "
                Your Itinerary
                
                Dear {$itineraryDetails['customerName']},
                
                Please find attached your itinerary for your upcoming trip to {$itineraryDetails['destination']}.
                
                Itinerary: {$itineraryDetails['itineraryName']}
                Destination: {$itineraryDetails['destination']}
                Start Date: {$itineraryDetails['startDate']}
                End Date: {$itineraryDetails['endDate']}
                
                We've attached a detailed PDF with your complete itinerary.
                If you have any questions or need to make changes, please contact us.
                
                We wish you a pleasant journey!
                
                Best regards,
                {$companyName}
            ";
            
            // Add PDF attachment if provided
            if (isset($data['pdfBuffer'])) {
                $pdfContent = $data['pdfBuffer'];
                
                // Convert array back to binary
                $pdfBinary = '';
                foreach ($pdfContent as $byte) {
                    $pdfBinary .= chr($byte);
                }
                
                // Add attachment
                $mail->addStringAttachment($pdfBinary, "itinerary_{$itineraryDetails['itineraryName']}.pdf", 'base64', 'application/pdf');
            }
            break;
            
        case 'payment':
            // Handle payment receipt email
            if (!isset($data['paymentDetails'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing payment details']);
                exit();
            }
            
            // Make sure all required fields are available with defaults
            $paymentDetails = $data['paymentDetails'];
            $paymentDetails = array_merge([
                'paymentId' => 'Unknown',
                'amount' => 'Not specified',
                'date' => date('Y-m-d')
            ], $paymentDetails);
            
            $mail->Subject = "Payment Receipt - " . $paymentDetails['paymentId'];
            
            // Create HTML content for payment receipt email
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #2563eb;'>Payment Receipt</h2>
                    <p>Dear Customer,</p>
                    <p>Thank you for your payment. Please find your receipt details below:</p>
                    
                    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                        <p><strong>Payment ID:</strong> {$paymentDetails['paymentId']}</p>
                        <p><strong>Amount:</strong> {$paymentDetails['amount']}</p>
                        <p><strong>Date:</strong> {$paymentDetails['date']}</p>
                    </div>
                    
                    <p>We've attached a detailed receipt as a PDF.</p>
                    <p>If you have any questions about this payment, please contact us.</p>
                    <p>Thank you for your business!</p>
                    <p>Best regards,<br>{$companyName}</p>
                </div>
            ";
            
            $mail->AltBody = "
                Payment Receipt
                
                Dear Customer,
                
                Thank you for your payment. Please find your receipt details below:
                
                Payment ID: {$paymentDetails['paymentId']}
                Amount: {$paymentDetails['amount']}
                Date: {$paymentDetails['date']}
                
                We've attached a detailed receipt as a PDF.
                If you have any questions about this payment, please contact us.
                
                Thank you for your business!
                
                Best regards,
                {$companyName}
            ";
            
            // Add PDF attachment if provided
            if (isset($data['pdfBuffer'])) {
                $pdfContent = $data['pdfBuffer'];
                
                // Convert array back to binary
                $pdfBinary = '';
                foreach ($pdfContent as $byte) {
                    $pdfBinary .= chr($byte);
                }
                
                // Add attachment
                $mail->addStringAttachment($pdfBinary, "receipt_{$paymentDetails['paymentId']}.pdf", 'base64', 'application/pdf');
            }
            break;
            
        case 'test':
            // Handle test email
            $mail->Subject = "Test Email - SMTP Configuration";
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #2563eb;'>SMTP Configuration Test</h2>
                    <p>This is a test email to verify your SMTP settings are working correctly.</p>
                    
                    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                        <p><strong>SMTP Host:</strong> {$config['smtp']['host']}</p>
                        <p><strong>SMTP Port:</strong> {$config['smtp']['port']}</p>
                        <p><strong>SMTP User:</strong> {$config['smtp']['username']}</p>
                        <p><strong>Sender Name:</strong> {$config['email']['from_name']}</p>
                        <p><strong>Sender Email:</strong> {$config['email']['from_email']}</p>
                    </div>
                    
                    <p>If you received this email, your SMTP configuration is working correctly!</p>
                    <p>Best regards,<br>{$companyName}</p>
                </div>
            ";
            
            $mail->AltBody = "
                SMTP Configuration Test
                
                This is a test email to verify your SMTP settings are working correctly.
                
                SMTP Host: {$config['smtp']['host']}
                SMTP Port: {$config['smtp']['port']}
                SMTP User: {$config['smtp']['username']}
                Sender Name: {$config['email']['from_name']}
                Sender Email: {$config['email']['from_email']}
                
                If you received this email, your SMTP configuration is working correctly!
                
                Best regards,
                {$companyName}
            ";
            break;
            
        default:
            // Default contact form email
            $mail->Subject = $config['email']['subject'];
            $mail->Body    = "
                <h3>New message from your website</h3>
                <p><strong>Name:</strong> {$data['name']}</p>
                <p><strong>Email:</strong> {$data['email']}</p>
                <p><strong>Message:</strong></p>
                <p>{$data['message']}</p>
            ";
            $mail->AltBody = "New message from {$data['name']} ({$data['email']}): {$data['message']}";
            break;
    }

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Email could not be sent', 'details' => $mail->ErrorInfo]);
} 
<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include the autoloader using a relative path
require_once 'vendor/autoload.php';

// Import PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Load configuration
$config = require 'config.php';

echo "<h1>PHPMailer Test</h1>";
echo "<p>Testing PHPMailer configuration...</p>";

// Create a new PHPMailer instance
$mail = new PHPMailer(true);

try {
    // Output debug info
    echo "<h2>Configuration</h2>";
    echo "<pre>";
    echo "SMTP Host: " . $config['smtp']['host'] . "\n";
    echo "SMTP Port: " . $config['smtp']['port'] . "\n";
    echo "SMTP Username: " . $config['smtp']['username'] . "\n";
    echo "SMTP Password: " . (empty($config['smtp']['password']) ? "Not set" : "Set (hidden)") . "\n";
    echo "From Email: " . $config['email']['from_email'] . "\n";
    echo "From Name: " . $config['email']['from_name'] . "\n";
    echo "</pre>";

    // Server settings
    $mail->SMTPDebug = SMTP::DEBUG_SERVER; // Enable verbose debug output
    $mail->isSMTP();                       // Send using SMTP
    $mail->Host       = $config['smtp']['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['smtp']['username'];
    $mail->Password   = $config['smtp']['password'];
    $mail->SMTPSecure = $config['smtp']['encryption'] === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $config['smtp']['port'];

    // This is just a test, so we won't actually send an email
    echo "<h2>PHPMailer Setup Test</h2>";
    echo "<p style='color: green;'>PHPMailer classes loaded successfully!</p>";
    
    // Uncomment the following lines to actually send a test email
    /*
    // Recipients
    $mail->setFrom($config['email']['from_email'], $config['email']['from_name']);
    $mail->addAddress('test@example.com');
    
    // Content
    $mail->isHTML(true);
    $mail->Subject = 'PHPMailer Test';
    $mail->Body    = 'This is a test email from PHPMailer';
    $mail->AltBody = 'This is a test email from PHPMailer';
    
    $mail->send();
    echo "<p style='color: green;'>Test message has been sent</p>";
    */
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $mail->ErrorInfo . "</p>";
    echo "<p>Exception message: " . $e->getMessage() . "</p>";
}
?> 
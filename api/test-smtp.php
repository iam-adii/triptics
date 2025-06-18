<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

// Handle fatal errors
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

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get the raw POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Check if JSON is valid
if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
    exit();
}

// Check required SMTP settings
if (!isset($data['smtp_host']) || !isset($data['smtp_port']) || 
    !isset($data['smtp_user']) || !isset($data['smtp_password']) ||
    !isset($data['sender_name']) || !isset($data['sender_email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required SMTP settings']);
    exit();
}

// Include the autoloader
try {
    require_once 'vendor/autoload.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Autoloader error: ' . $e->getMessage()]);
    exit();
}

// Import PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Test SMTP connection
try {
    // Create a new PHPMailer instance
    $mail = new PHPMailer(true);

    // Server settings
    $mail->SMTPDebug = SMTP::DEBUG_CONNECTION; // Enable verbose debug output but save to variable
    $mail->Debugoutput = function($str, $level) use (&$debugOutput) {
        $debugOutput[] = $str;
    };
    $debugOutput = [];

    $mail->isSMTP();
    $mail->Host       = $data['smtp_host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $data['smtp_user'];
    $mail->Password   = $data['smtp_password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $data['smtp_port'];

    // Try to connect to SMTP server
    if (!$mail->smtpConnect()) {
        throw new Exception('SMTP connection failed');
    }
    
    // If we got here, connection was successful
    $mail->smtpClose();
    
    echo json_encode([
        'success' => true, 
        'message' => 'SMTP connection successful',
        'debug' => $debugOutput
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'SMTP Error: ' . $mail->ErrorInfo ?: $e->getMessage(),
        'debug' => $debugOutput ?? []
    ]);
}
?> 
<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Path Check</h1>";

// Current directory
echo "<p>Current directory: " . getcwd() . "</p>";

// Check if vendor directory exists
$vendorDir = 'vendor';
echo "<p>Vendor directory exists: " . (is_dir($vendorDir) ? 'Yes' : 'No') . "</p>";

// Check if autoload.php exists
$autoloadPath = 'vendor/autoload.php';
echo "<p>autoload.php exists: " . (file_exists($autoloadPath) ? 'Yes' : 'No') . "</p>";

// Check phpmailer directory
$phpmailerDir = 'vendor/phpmailer';
echo "<p>phpmailer directory exists: " . (is_dir($phpmailerDir) ? 'Yes' : 'No') . "</p>";

// Check src directory
$srcDir = 'vendor/phpmailer/src';
echo "<p>src directory exists: " . (is_dir($srcDir) ? 'Yes' : 'No') . "</p>";

// List files in vendor directory
echo "<h2>Files in vendor directory:</h2>";
if (is_dir($vendorDir)) {
    $files = scandir($vendorDir);
    echo "<ul>";
    foreach ($files as $file) {
        if ($file != "." && $file != "..") {
            echo "<li>" . $file . "</li>";
        }
    }
    echo "</ul>";
} else {
    echo "<p>Cannot list files: vendor directory does not exist</p>";
}

// List files in phpmailer directory if it exists
echo "<h2>Files in phpmailer directory:</h2>";
if (is_dir($phpmailerDir)) {
    $files = scandir($phpmailerDir);
    echo "<ul>";
    foreach ($files as $file) {
        if ($file != "." && $file != "..") {
            echo "<li>" . $file . "</li>";
        }
    }
    echo "</ul>";
} else {
    echo "<p>Cannot list files: phpmailer directory does not exist</p>";
}

// Server information
echo "<h2>Server Information:</h2>";
echo "<p>PHP Version: " . phpversion() . "</p>";
echo "<p>Include Path: " . get_include_path() . "</p>";
echo "<p>Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
?> 
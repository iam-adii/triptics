<?php
// Email Configuration
return [
    // SMTP Settings
    'smtp' => [
        'host' => 'mail.uniexdesigns.in',  // Replace with your SMTP server
        'username' => 'triptics@uniexdesigns.in',  // Replace with your email
        'password' => 'Triptics@00021',  // Replace with your email password
        'port' => 587,
        'encryption' => 'tls',  // tls or ssl
    ],
    
    // Email Settings
    'email' => [
        'from_email' => 'triptics@uniexdesigns.in',  // Replace with your email
        'from_name' => 'Triptics',  // Replace with your name
        'recipient' => 'triptics@gmail.com',  // Replace with recipient email
        'subject' => 'New Contact Form Submission',
    ],
    
    // Security Settings
    'security' => [
        'allowed_origins' => ['http://localhost:8080', 'https://triptics.uniexdesigns.in'],  // Replace with your domains
        'rate_limit' => 50,  // Maximum emails per hour from the same IP
    ],
]; 
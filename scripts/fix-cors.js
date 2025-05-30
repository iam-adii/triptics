#!/usr/bin/env node

/**
 * CORS Fix Script for Supabase Integration
 * 
 * This script modifies the built files to add proper CORS headers
 * for Supabase requests in production.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.blue}[CORS Fix] Starting CORS fix process...${colors.reset}`);

// Path to the index.html file in the dist directory
const indexHtmlPath = path.join(__dirname, '../dist/index.html');

// Check if the file exists
if (!fs.existsSync(indexHtmlPath)) {
  console.error(`${colors.red}[CORS Fix] ERROR: Could not find index.html at ${indexHtmlPath}${colors.reset}`);
  process.exit(1);
}

try {
  // Read the index.html file
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Add CORS helper script to handle Supabase requests
  const corsScript = `
    <script>
      // CORS Fix: Add headers to Supabase requests
      (function() {
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          // Only intercept Supabase requests
          if (typeof url === 'string' && url.includes('supabase')) {
            console.log('Intercepting Supabase request:', url);
            
            // Create new options with CORS headers
            const newOptions = { ...options };
            newOptions.headers = new Headers(newOptions.headers || {});
            
            // Add origin header
            if (window.location && window.location.origin) {
              newOptions.headers.set('Origin', window.location.origin);
            }
            
            // Add credentials if not already set
            if (!newOptions.credentials) {
              newOptions.credentials = 'same-origin';
            }
            
            return originalFetch(url, newOptions)
              .then(response => {
                // Log successful responses
                if (response.ok) {
                  console.log('Supabase request successful:', url);
                } else {
                  console.warn('Supabase request failed:', url, response.status, response.statusText);
                }
                return response;
              })
              .catch(error => {
                console.error('Supabase fetch error:', error);
                throw error;
              });
          }
          
          // Process other requests normally
          return originalFetch(url, options);
        };
        
        console.log('CORS Fix: Fetch interceptor installed for Supabase requests');
      })();
    </script>
  `;
  
  // Check if the script is already added
  if (!indexHtml.includes('CORS Fix: Add headers to Supabase requests')) {
    // Insert the script right before the closing </head> tag
    indexHtml = indexHtml.replace('</head>', `${corsScript}\n  </head>`);
    
    // Write the modified file
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log(`${colors.green}[CORS Fix] Added CORS fix script to index.html${colors.reset}`);
  } else {
    console.log(`${colors.yellow}[CORS Fix] CORS fix script already exists in index.html${colors.reset}`);
  }
  
  console.log(`${colors.green}[CORS Fix] CORS fix process completed successfully${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}[CORS Fix] ERROR: ${error.message}${colors.reset}`);
  process.exit(1);
} 
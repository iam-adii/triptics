#!/usr/bin/env node

/**
 * Production Build Script
 * 
 * This script performs the following tasks:
 * 1. Verifies Supabase configuration is available
 * 2. Builds the application for production
 * 3. Generates a verification file to check connectivity
 */

import { execSync } from 'child_process';
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

console.log(`${colors.blue}[Build] Starting production build process...${colors.reset}`);

// 1. Check Supabase configuration in client.ts
try {
  const supabaseClientPath = path.join(__dirname, '../src/integrations/supabase/client.ts');
  
  if (fs.existsSync(supabaseClientPath)) {
    const clientContent = fs.readFileSync(supabaseClientPath, 'utf8');
    
    if (!clientContent.includes('SUPABASE_URL') || !clientContent.includes('SUPABASE_PUBLISHABLE_KEY')) {
      console.error(`${colors.red}[Build] ERROR: Supabase configuration is missing in client.ts${colors.reset}`);
      process.exit(1);
    }
    
    console.log(`${colors.green}[Build] Supabase configuration validated${colors.reset}`);
  } else {
    console.error(`${colors.red}[Build] ERROR: Could not find Supabase client file at ${supabaseClientPath}${colors.reset}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`${colors.red}[Build] ERROR checking Supabase configuration: ${error.message}${colors.reset}`);
  process.exit(1);
}

// 2. Build the application
try {
  console.log(`${colors.blue}[Build] Running production build...${colors.reset}`);
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`${colors.green}[Build] Build completed successfully${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}[Build] Build failed: ${error.message}${colors.reset}`);
  process.exit(1);
}

// 3. Generate a verification file in the dist directory
try {
  const verificationPath = path.join(__dirname, '../dist/supabase-check.html');
  const supabaseClientPath = path.join(__dirname, '../src/integrations/supabase/client.ts');
  const clientContent = fs.readFileSync(supabaseClientPath, 'utf8');
  
  // Extract Supabase URL and key from client.ts
  const urlMatch = clientContent.match(/SUPABASE_URL\s*=\s*["']([^"']+)["']/);
  const keyMatch = clientContent.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*["']([^"']+)["']/);
  
  if (!urlMatch || !keyMatch) {
    console.warn(`${colors.yellow}[Build] WARNING: Could not extract Supabase credentials for verification file${colors.reset}`);
    process.exit(0);
  }
  
  const supabaseUrl = urlMatch[1];
  const supabaseKey = keyMatch[1];
  
  const verificationContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supabase Connection Verification</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .success { color: green; }
    .error { color: red; }
    pre { background: #f1f1f1; padding: 10px; border-radius: 4px; overflow: auto; }
    button { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #2563eb; }
    #result { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Supabase Connection Verification</h1>
  <p>This page tests the connection to your Supabase backend.</p>
  
  <button id="testBtn">Test Connection</button>
  <div id="result"></div>

  <script>
    document.getElementById('testBtn').addEventListener('click', async () => {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '<p>Testing connection...</p>';
      
      try {
        const response = await fetch('${supabaseUrl}/rest/v1/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': '${supabaseKey}'
          }
        });
        
        const status = response.status;
        const statusText = response.statusText;
        
        if (status >= 200 && status < 300) {
          resultDiv.innerHTML = \`
            <h2 class="success">Connection Successful</h2>
            <p>Status: \${status} \${statusText}</p>
            <p>Your Supabase connection is working correctly.</p>
          \`;
        } else {
          resultDiv.innerHTML = \`
            <h2 class="error">Connection Error</h2>
            <p>Status: \${status} \${statusText}</p>
            <p>Your Supabase connection returned an error status code.</p>
          \`;
        }
      } catch (error) {
        resultDiv.innerHTML = \`
          <h2 class="error">Connection Failed</h2>
          <p>Error: \${error.message}</p>
          <p>Unable to connect to Supabase. This could be due to:</p>
          <ul>
            <li>Network connectivity issues</li>
            <li>CORS configuration problems</li>
            <li>Supabase service being down</li>
          </ul>
        \`;
      }
    });
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(verificationPath, verificationContent);
  console.log(`${colors.green}[Build] Created Supabase verification file at ${verificationPath}${colors.reset}`);
} catch (error) {
  console.warn(`${colors.yellow}[Build] WARNING: Could not create verification file: ${error.message}${colors.reset}`);
}

console.log(`${colors.blue}[Build] Build process completed!${colors.reset}`);
console.log(`${colors.magenta}[Build] Important deployment notes:${colors.reset}`);
console.log(`${colors.cyan}[Build] 1. Make sure CORS is properly configured in your Supabase project${colors.reset}`);
console.log(`${colors.cyan}[Build] 2. After deployment, check the /supabase-check.html page to verify connectivity${colors.reset}`);
console.log(`${colors.cyan}[Build] 3. If issues persist, inspect the browser console for detailed error logs${colors.reset}`); 
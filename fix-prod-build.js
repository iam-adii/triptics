import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// First build the app
console.log('Building the application...');
execSync('npm run build', { stdio: 'inherit' });

// Copy .htaccess to dist folder
console.log('Copying .htaccess to dist folder...');
if (fs.existsSync('.htaccess')) {
  fs.copyFileSync('.htaccess', path.join('dist', '.htaccess'));
}

// Create a fix for React scheduler
console.log('Creating scheduler fix...');
const schedulerFixContent = `
// React scheduler fix
window.scheduler = window.scheduler || { unstable_scheduleCallback: function(callback) { setTimeout(callback, 0); return { id: 0 }; } };
window.SchedulerTracing = window.SchedulerTracing || { __interactionsRef: { current: null }, __subscriberRef: { current: null } };
`;

// Prepend to the index.js file
const indexJsPath = path.join('dist', 'assets', 'index.js');
if (fs.existsSync(indexJsPath)) {
  const originalContent = fs.readFileSync(indexJsPath, 'utf8');
  fs.writeFileSync(indexJsPath, schedulerFixContent + originalContent);
  console.log('Added scheduler fix to index.js');
} else {
  console.error('Could not find index.js in dist/assets folder');
}

console.log('Creating a bootstrap script...');
const bootstrapScript = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Triptics - Loading...</title>
  <style>
    body, html { 
      margin: 0; 
      padding: 0; 
      height: 100%; 
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f9fafb;
    }
    .loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: #f9fafb;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(16, 185, 129, 0.2);
      border-radius: 50%;
      border-top-color: #10b981;
      animation: spin 1s ease infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .message {
      margin-top: 20px;
      color: #4b5563;
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <div class="message">Loading Triptics...</div>
  </div>
  
  <script>
    // Ensure scheduler is available
    window.scheduler = window.scheduler || { 
      unstable_scheduleCallback: function(callback) { 
        setTimeout(callback, 0); 
        return { id: 0 }; 
      },
      unstable_cancelCallback: function() {},
      unstable_shouldYield: function() { return false; },
      unstable_requestPaint: function() {},
      unstable_now: function() { return Date.now(); },
      unstable_getCurrentPriorityLevel: function() { return 3; },
      unstable_ImmediatePriority: 1,
      unstable_UserBlockingPriority: 2,
      unstable_NormalPriority: 3,
      unstable_LowPriority: 4,
      unstable_IdlePriority: 5
    };
    
    // Load the actual application
    setTimeout(function() {
      window.location.href = './index.html';
    }, 500);
  </script>
</body>
</html>
`;

// Write the bootstrap script
fs.writeFileSync(path.join('dist', 'bootstrap.html'), bootstrapScript);

console.log('\nProduction build fixed successfully!');
console.log('1. Upload all files from the dist folder to your cPanel');
console.log('2. Try loading bootstrap.html first if you still see blank screens');
console.log('3. Ensure the .htaccess file is uploaded and not blocked'); 
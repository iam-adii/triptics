/**
 * This script helps fix common Supabase configuration issues that might cause blank screens
 * 
 * Usage:
 * 1. npm install
 * 2. node scripts/fix-blank-screen.js
 */

console.log("Triptics - Fixing Blank Screen Issues");
console.log("=====================================");
console.log("This script will help identify and fix common issues causing blank screens.");
console.log("");

// Check for browser-safe client setup
try {
  const fs = require('fs');
  const path = require('path');
  
  // Paths to important files
  const clientPath = path.join(__dirname, '../src/integrations/supabase/client.ts');
  const envPath = path.join(__dirname, '../src/utils/env.ts');
  const envDtsPath = path.join(__dirname, '../src/vite-env.d.ts');
  
  console.log("Checking client.ts file...");
  
  if (fs.existsSync(clientPath)) {
    const clientContent = fs.readFileSync(clientPath, 'utf8');
    
    if (clientContent.includes('process.env') && !clientContent.includes('typeof process')) {
      console.log("❌ Found unsafe process.env usage in client.ts");
      console.log("   This can cause blank screens in the browser");
      console.log("");
      console.log("✅ Fix: Update client.ts to use safe environment variable access:");
      console.log("   import { ENV } from '@/utils/env';");
      console.log("   const SUPABASE_SERVICE_ROLE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY || '';");
    } else {
      console.log("✅ client.ts looks good");
    }
  } else {
    console.log("❌ client.ts not found at expected location");
  }
  
  console.log("");
  console.log("Checking for env utility...");
  
  if (!fs.existsSync(envPath)) {
    console.log("❌ env.ts utility file not found");
    console.log("   This file helps safely access environment variables in the browser");
    console.log("");
    console.log("✅ Fix: Create src/utils/env.ts with browser-safe environment variable access");
  } else {
    console.log("✅ env.ts utility found");
  }
  
  console.log("");
  console.log("Checking for type definitions...");
  
  if (!fs.existsSync(envDtsPath)) {
    console.log("❓ vite-env.d.ts not found or might need updates");
    console.log("   This file helps TypeScript understand environment variables");
  } else {
    console.log("✅ vite-env.d.ts found");
  }
  
  console.log("");
  console.log("Other common issues causing blank screens:");
  console.log("1. ReferenceError: process is not defined");
  console.log("   - Solution: Use the env.ts utility to access environment variables");
  console.log("");
  console.log("2. TypeError: Cannot read properties of undefined (reading 'NODE_ENV')");
  console.log("   - Solution: Check for direct process.env access in your code");
  console.log("");
  console.log("3. Uncaught ReferenceError: process is not defined");
  console.log("   - Solution: Use the isLocalhost() and isDevelopment() functions");
  console.log("");
  console.log("If the issue persists, try clearing browser cache or using incognito mode.");
  
} catch (error) {
  console.error("Error running diagnostics:", error);
} 
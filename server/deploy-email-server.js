#!/usr/bin/env node

/**
 * Deployment script for the email server
 * 
 * This script helps deploy the email server to a production environment.
 * It packages the necessary files and uploads them to the server.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Main deployment function
async function deployEmailServer() {
  console.log('\n=============================================');
  console.log('    TRIPTICS EMAIL SERVER DEPLOYMENT TOOL    ');
  console.log('=============================================\n');

  try {
    // Ask for deployment details
    const server = await question('Enter server address (e.g., user@example.com): ');
    const remotePath = await question('Enter remote path (e.g., /home/user/email-server): ');
    const useSSL = (await question('Use SSL/TLS? (y/n): ')).toLowerCase() === 'y';
    const port = await question('Server port (default: 3001): ') || '3001';
    
    console.log('\nCreating production package...');
    
    // Create temp directory for the package
    const tempDir = path.join(__dirname, 'temp-deploy');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir);
    
    // Files to include in the package
    const filesToInclude = [
      'index.js',
      'package.json',
      'package-lock.json',
      'README.md'
    ];
    
    // Copy files to temp directory
    filesToInclude.forEach(file => {
      if (fs.existsSync(path.join(__dirname, file))) {
        fs.copyFileSync(
          path.join(__dirname, file),
          path.join(tempDir, file)
        );
      }
    });
    
    // Create production .env file
    const envContent = `# Server configuration
PORT=${port}

# CORS settings
CORS_ORIGIN=*

# Environment
NODE_ENV=production
`;
    fs.writeFileSync(path.join(tempDir, '.env'), envContent);
    
    // Create ecosystem.config.js for PM2
    const pm2Config = `module.exports = {
  apps: [{
    name: 'triptics-email-server',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
      PORT: ${port}
    }
  }]
};
`;
    fs.writeFileSync(path.join(tempDir, 'ecosystem.config.js'), pm2Config);
    
    // Create deployment package
    console.log('Creating zip package...');
    const zipFilename = 'email-server-deploy.zip';
    execSync(`cd "${tempDir}" && zip -r ../${zipFilename} ./*`);
    
    // Upload to server
    console.log(`\nUploading to ${server}:${remotePath}...`);
    execSync(`scp ${zipFilename} ${server}:${remotePath}/`);
    
    // Execute remote deployment commands
    console.log('\nDeploying on remote server...');
    const deployCommands = [
      `mkdir -p ${remotePath}`,
      `cd ${remotePath}`,
      `unzip -o ${zipFilename}`,
      'npm install --production',
      'pm2 stop triptics-email-server || true',
      'pm2 start ecosystem.config.js'
    ];
    
    execSync(`ssh ${server} "${deployCommands.join(' && ')}"`);
    
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(zipFilename);
    
    console.log('\n=============================================');
    console.log('       DEPLOYMENT COMPLETED SUCCESSFULLY     ');
    console.log('=============================================\n');
    console.log(`Email server is now running on ${server}:${port}`);
    
    if (useSSL) {
      console.log('\nRemember to set up SSL/TLS with Nginx or Apache:');
      console.log('1. Install Certbot and obtain SSL certificate');
      console.log('2. Configure reverse proxy to the email server');
      console.log('3. Update the frontend EMAIL_API_URL to use HTTPS');
    }
    
  } catch (error) {
    console.error('\nDeployment failed:', error.message);
    console.error('Please check your SSH credentials and try again.');
  } finally {
    rl.close();
  }
}

deployEmailServer(); 
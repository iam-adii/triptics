const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== Triptics API Server Setup ===${colors.reset}\n`);

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log(`${colors.yellow}Creating .env file...${colors.reset}`);
  
  // Sample .env content
  const envContent = `# Server configuration
PORT=3001
NODE_ENV=development

# CORS settings
CORS_ORIGIN=http://localhost:5173

# JWT Secret
JWT_SECRET=change-this-to-a-secure-random-string-in-production

# Supabase configuration
SUPABASE_URL=
SUPABASE_KEY=
`;
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}✓ .env file created${colors.reset}`);
    console.log(`${colors.yellow}Please update the .env file with your Supabase credentials${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}✗ Failed to create .env file: ${err.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.green}✓ .env file already exists${colors.reset}`);
}

// Install dependencies
console.log(`\n${colors.yellow}Installing dependencies...${colors.reset}`);
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Dependencies installed successfully${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}✗ Failed to install dependencies: ${err.message}${colors.reset}`);
  process.exit(1);
}

// Install type declarations
console.log(`\n${colors.yellow}Installing type declarations...${colors.reset}`);
try {
  execSync('npm install --save-dev @types/express @types/cors @types/morgan @types/compression @types/cookie-parser @types/jsonwebtoken', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Type declarations installed successfully${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}✗ Failed to install type declarations: ${err.message}${colors.reset}`);
}

// Check if TypeScript is installed
console.log(`\n${colors.yellow}Checking TypeScript installation...${colors.reset}`);
try {
  execSync('tsc --version', { stdio: 'pipe' });
  console.log(`${colors.green}✓ TypeScript is installed${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}✗ TypeScript is not installed globally${colors.reset}`);
  console.log(`${colors.yellow}Using local TypeScript installation...${colors.reset}`);
}

// Create dist directory if it doesn't exist
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.log(`\n${colors.yellow}Creating dist directory...${colors.reset}`);
  try {
    fs.mkdirSync(distPath);
    console.log(`${colors.green}✓ dist directory created${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}✗ Failed to create dist directory: ${err.message}${colors.reset}`);
  }
}

console.log(`\n${colors.bright}${colors.green}Setup completed successfully!${colors.reset}`);
console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
console.log(`1. Update the .env file with your Supabase credentials`);
console.log(`2. Run ${colors.bright}npm run build${colors.reset} to compile TypeScript`);
console.log(`3. Run ${colors.bright}npm run dev${colors.reset} to start the development server`);
console.log(`\n${colors.bright}${colors.cyan}Happy coding!${colors.reset}\n`); 
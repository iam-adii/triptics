import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build the app
console.log('Building the application...');
execSync('npm run build', { stdio: 'inherit' });

// Create API directory if it doesn't exist
console.log('Setting up API directory...');
if (!fs.existsSync(path.join('dist', 'api'))) {
    fs.mkdirSync(path.join('dist', 'api'), { recursive: true });
}

// Copy API files to dist folder
if (fs.existsSync('api')) {
    console.log('Copying API files to dist folder...');
    const copyDir = (src, dest) => {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                copyDir(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    };
    
    copyDir('api', path.join('dist', 'api'));
}

// Copy .htaccess to dist folder
console.log('Copying .htaccess to dist folder...');
fs.copyFileSync('.htaccess', path.join('dist', '.htaccess'));

// Copy deployment guides to dist folder
console.log('Copying deployment guides to dist folder...');
fs.copyFileSync('CPANEL_DEPLOYMENT.md', path.join('dist', 'CPANEL_DEPLOYMENT.md'));

// Create a simple PHP test file to check server configuration
const phpTestContent = `<?php
// Test PHP file to check server configuration
phpinfo();
?>`;

fs.writeFileSync(path.join('dist', 'phpinfo.php'), phpTestContent);

// Create a simple info.txt file with deployment notes
const infoContent = `Triptics Application Deployment

Deployment Date: ${new Date().toLocaleString()}

Important Notes:
1. The .htaccess file is crucial for proper routing
2. All files should be uploaded to the cPanel document root or subdirectory
3. If uploading to a subdirectory, update vite.config.ts 'base' path
4. Delete phpinfo.php after checking server configuration

For troubleshooting:
- Check browser console for errors
- Verify .htaccess is uploaded and not blocked
- Ensure all files have proper permissions (644 for files, 755 for directories)
- See CPANEL_DEPLOYMENT.md for detailed instructions
`;

fs.writeFileSync(path.join('dist', 'deployment-info.txt'), infoContent);

console.log('Creating zip file for easy upload...');
try {
  execSync('cd dist && zip -r ../triptics-dist.zip .', { stdio: 'inherit' });
  console.log('Successfully created triptics-dist.zip');
} catch (error) {
  console.log('Could not create zip file. Please zip the dist folder manually.');
}

console.log('\nDeployment package created successfully!');
console.log('1. Upload all files from the dist folder to your cPanel');
console.log('2. Ensure .htaccess file is included in the upload');
console.log('3. Access phpinfo.php to check server configuration, then delete it');
console.log('4. If using a subdirectory deployment, update base path in vite.config.ts before building'); 
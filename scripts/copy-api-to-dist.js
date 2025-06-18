import fs from 'fs';
import path from 'path';

/**
 * Recursively copy a directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip node_modules and vendor directories
    if (entry.name === 'node_modules' || entry.name === 'vendor') {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively copy directory
      copyDir(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Main execution
try {
  const apiDir = path.resolve(process.cwd(), 'api');
  const distApiDir = path.resolve(process.cwd(), 'dist/api');

  if (fs.existsSync(apiDir)) {
    console.log('Copying API directory to dist...');
    copyDir(apiDir, distApiDir);
    console.log('API directory copied successfully!');
  } else {
    console.log('API directory not found, skipping copy.');
  }
} catch (error) {
  console.error('Error copying API directory:', error);
  process.exit(1);
} 
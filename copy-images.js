const fs = require('fs');
const path = require('path');

// Paths
const sourceDir = path.join(__dirname, 'MCS-Sales-Boost', 'client', 'public', 'images');
const targetDir = path.join(__dirname, 'public', 'images');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Copy files
try {
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    // Check if it's a file (not a directory)
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied: ${file}`);
    }
  });
  
  console.log('All image files copied successfully!');
} catch (error) {
  console.error('Error copying files:', error);
} 
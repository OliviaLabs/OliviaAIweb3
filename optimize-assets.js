#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script to optimize large assets for production build
console.log('🔧 Optimizing assets for production build...');

const publicDir = path.join(__dirname, 'public');
const tempDir = path.join(__dirname, 'temp-assets');

// Create temp directory if it doesn't exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// List of large assets that are not used in the code
const unusedLargeAssets = [
  'background-video.mp4',
  'OLIVIA FOR PHONE .mp4'
];

// Move unused large assets to temp folder during build
unusedLargeAssets.forEach(asset => {
  const sourcePath = path.join(publicDir, asset);
  const tempPath = path.join(tempDir, asset);
  
  if (fs.existsSync(sourcePath)) {
    console.log(`📁 Moving unused ${asset} to temp folder during build...`);
    fs.renameSync(sourcePath, tempPath);
  }
});

// Keep the THINKING ICON.gif as it's used in the code
console.log('✅ Asset optimization complete!');
console.log('💡 Large unused assets moved to temp folder during build.');
console.log('🔄 Run restore-assets.js after build to restore them.');

#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script to restore large assets after build
console.log('🔄 Restoring assets after build...');

const publicDir = path.join(__dirname, 'public');
const tempDir = path.join(__dirname, 'temp-assets');

// List of assets that were moved to temp folder
const movedAssets = [
  'background-video.mp4',
  'OLIVIA FOR PHONE .mp4'
];

// Restore moved assets
movedAssets.forEach(asset => {
  const tempPath = path.join(tempDir, asset);
  const destPath = path.join(publicDir, asset);
  
  if (fs.existsSync(tempPath)) {
    console.log(`📁 Restoring ${asset} to public folder...`);
    fs.renameSync(tempPath, destPath);
  }
});

// Clean up temp directory if empty
try {
  const tempFiles = fs.readdirSync(tempDir);
  if (tempFiles.length === 0) {
    fs.rmdirSync(tempDir);
    console.log('🧹 Cleaned up temp directory');
  }
} catch (error) {
  // Directory might not exist, ignore
}

console.log('✅ Asset restoration complete!');

#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Log with timestamp
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Execute a command and log its output
function execute(command) {
  log(`Executing: ${command}`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    return output;
  } catch (error) {
    log(`Error executing command: ${command}`);
    log(error.toString());
    process.exit(1);
  }
}

// Main build function
async function build() {
  log('Starting Vercel build process');

  // Build the client
  log('Building client...');
  execute('npx vite build');

  // Build the server
  log('Building server...');
  execute('npx tsc -p tsconfig.server.json');

  // Create the output directories for Vercel
  log('Setting up Vercel output directory structure...');
  
  // Create the output directory structure
  const outputDir = path.join(process.cwd(), '.vercel', 'output');
  const staticDir = path.join(outputDir, 'static');
  const functionDir = path.join(outputDir, 'functions');
  const apiDir = path.join(functionDir, 'api');
  
  // Ensure directories exist
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(staticDir, { recursive: true });
  fs.mkdirSync(functionDir, { recursive: true });
  fs.mkdirSync(apiDir, { recursive: true });

  // Copy static files
  log('Copying static files...');
  execute(`cp -r dist/public/* ${staticDir}`);

  // Create the API function
  log('Creating API function...');
  
  // Create the API function configuration
  const apiConfig = {
    runtime: 'nodejs18.x',
    handler: 'index.js',
    launcherType: 'Nodejs',
  };
  
  // Write the API function configuration
  fs.writeFileSync(
    path.join(apiDir, '.vc-config.json'),
    JSON.stringify(apiConfig, null, 2)
  );
  
  // Copy the server files to the API function directory
  execute(`cp -r dist/server/* ${apiDir}`);

  // Create the Vercel config file
  log('Creating Vercel config file...');
  
  const config = {
    version: 3,
    routes: [
      {
        src: '/api/(.*)',
        dest: '/api'
      },
      {
        handle: 'filesystem'
      },
      {
        src: '/(.*)',
        dest: '/index.html'
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'config.json'),
    JSON.stringify(config, null, 2)
  );

  log('Build completed successfully');
}

build().catch(error => {
  log('Build failed:');
  log(error.toString());
  process.exit(1);
});

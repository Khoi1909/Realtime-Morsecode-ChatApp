#!/usr/bin/env node

// Simple start script for Railway deployment
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Morse Code Chat Server...');
console.log('📂 Current working directory:', process.cwd());
console.log('📁 Starting from be directory...');

// Change to the be directory and start the server
const child = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'be'),
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

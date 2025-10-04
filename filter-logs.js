#!/usr/bin/env node

/**
 * Log Filter Script
 * This script helps filter and organize API logs for better readability
 */

const readline = require('readline');

// Color codes for output
const colors = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m',  // Reset
  GREEN: '\x1b[32m', // Green
  BLUE: '\x1b[34m'   // Blue
};

// Parse command line arguments
const args = process.argv.slice(2);
const showLevels = args.includes('--all') ? ['ERROR', 'WARN', 'INFO', 'DEBUG'] : 
                   args.includes('--errors') ? ['ERROR'] :
                   args.includes('--warnings') ? ['WARN'] :
                   args.includes('--info') ? ['INFO'] :
                   ['ERROR', 'WARN', 'INFO'];

const showPrisma = args.includes('--prisma');
const showRequests = args.includes('--requests');
const showBusiness = args.includes('--business');

console.log('🔍 TMS API Log Filter');
console.log('====================');
console.log(`📊 Showing levels: ${showLevels.join(', ')}`);
console.log(`🔍 Prisma queries: ${showPrisma ? 'ON' : 'OFF'}`);
console.log(`🌐 HTTP requests: ${showRequests ? 'ON' : 'OFF'}`);
console.log(`💼 Business logic: ${showBusiness ? 'ON' : 'OFF'}`);
console.log('====================\n');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let lineCount = 0;
let errorCount = 0;
let warningCount = 0;
let infoCount = 0;

rl.on('line', (line) => {
  lineCount++;
  
  // Skip empty lines
  if (!line.trim()) return;
  
  // Parse timestamp and level
  const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)/);
  const levelMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\] (ERROR|WARN|INFO|DEBUG)/);
  
  if (levelMatch) {
    const [, timestamp, level] = levelMatch;
    const message = line.substring(timestamp.length + level.length + 3);
    
    if (showLevels.includes(level)) {
      const color = colors[level] || colors.RESET;
      console.log(`${color}[${timestamp}] ${level}${colors.RESET} ${message}`);
      
      // Count by level
      switch (level) {
        case 'ERROR': errorCount++; break;
        case 'WARN': warningCount++; break;
        case 'INFO': infoCount++; break;
      }
    }
  } else if (showPrisma && line.includes('prisma:query')) {
    // Format Prisma queries
    const queryMatch = line.match(/prisma:query (.+)/);
    if (queryMatch) {
      console.log(`${colors.DEBUG}[PRISMA]${colors.RESET} ${queryMatch[1]}`);
    }
  } else if (showRequests && line.includes('HTTP/1.1')) {
    // Format HTTP requests
    const requestMatch = line.match(/(\d+\.\d+\.\d+\.\d+) - - \[([^\]]+)\] "([^"]+)" (\d+) -/);
    if (requestMatch) {
      const [, ip, timestamp, request, status] = requestMatch;
      const [method, url] = request.split(' ');
      const statusColor = status >= 500 ? colors.ERROR : status >= 400 ? colors.WARN : colors.GREEN;
      console.log(`${colors.BLUE}[HTTP]${colors.RESET} ${method} ${url} ${statusColor}${status}${colors.RESET} (${ip})`);
    }
  } else if (showBusiness && line.includes('Business Logic:')) {
    // Format business logic logs
    console.log(`${colors.GREEN}[BUSINESS]${colors.RESET} ${line}`);
  } else if (line.includes('🚀') || line.includes('✅') || line.includes('❌') || line.includes('⚠️')) {
    // Show startup and status messages
    console.log(line);
  }
});

rl.on('close', () => {
  console.log('\n====================');
  console.log('📊 Log Summary:');
  console.log(`   Total lines processed: ${lineCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Warnings: ${warningCount}`);
  console.log(`   Info: ${infoCount}`);
  console.log('====================');
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Log filtering stopped.');
  process.exit(0);
});

console.log('💡 Usage examples:');
console.log('   cat logs.txt | node filter-logs.js --errors');
console.log('   cat logs.txt | node filter-logs.js --all --prisma');
console.log('   cat logs.txt | node filter-logs.js --requests --business');
console.log('\n🔍 Filtering logs...\n');

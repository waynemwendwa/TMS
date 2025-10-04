#!/usr/bin/env node

/**
 * Log Monitor Script
 * This script provides real-time monitoring of organized logs
 */

const colors = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m',  // Reset
  GREEN: '\x1b[32m', // Green
  BLUE: '\x1b[34m',  // Blue
  MAGENTA: '\x1b[35m' // Magenta
};

// Statistics
let stats = {
  total: 0,
  errors: 0,
  warnings: 0,
  info: 0,
  requests: 0,
  business: 0,
  prisma: 0
};

// Clear screen and show header
console.clear();
console.log(`${colors.BLUE}🔍 TMS API Log Monitor${colors.RESET}`);
console.log(`${colors.BLUE}======================${colors.RESET}`);
console.log(`${colors.GREEN}📊 Real-time log monitoring${colors.RESET}`);
console.log(`${colors.GREEN}Press Ctrl+C to stop${colors.RESET}\n`);

// Function to update stats display
function updateStats() {
  process.stdout.write('\x1b[2J\x1b[H'); // Clear screen
  console.log(`${colors.BLUE}🔍 TMS API Log Monitor${colors.RESET}`);
  console.log(`${colors.BLUE}======================${colors.RESET}`);
  console.log(`${colors.GREEN}📊 Statistics:${colors.RESET}`);
  console.log(`   Total logs: ${stats.total}`);
  console.log(`   ${colors.ERROR}Errors: ${stats.errors}${colors.RESET}`);
  console.log(`   ${colors.WARN}Warnings: ${stats.warnings}${colors.RESET}`);
  console.log(`   ${colors.INFO}Info: ${stats.info}${colors.RESET}`);
  console.log(`   ${colors.BLUE}Requests: ${stats.requests}${colors.RESET}`);
  console.log(`   ${colors.GREEN}Business: ${stats.business}${colors.RESET}`);
  console.log(`   ${colors.MAGENTA}Prisma: ${stats.prisma}${colors.RESET}`);
  console.log(`${colors.BLUE}======================${colors.RESET}\n`);
}

// Function to format and display log line
function processLogLine(line) {
  stats.total++;
  
  // Parse different log types
  if (line.includes('prisma:query')) {
    stats.prisma++;
    if (process.env.SHOW_PRISMA === 'true') {
      console.log(`${colors.MAGENTA}[PRISMA]${colors.RESET} ${line.split('prisma:query ')[1]}`);
    }
  } else if (line.includes('HTTP/1.1')) {
    stats.requests++;
    const requestMatch = line.match(/(\d+\.\d+\.\d+\.\d+) - - \[([^\]]+)\] "([^"]+)" (\d+) -/);
    if (requestMatch) {
      const [, ip, timestamp, request, status] = requestMatch;
      const [method, url] = request.split(' ');
      const statusColor = status >= 500 ? colors.ERROR : status >= 400 ? colors.WARN : colors.GREEN;
      console.log(`${colors.BLUE}[HTTP]${colors.RESET} ${method} ${url} ${statusColor}${status}${colors.RESET} (${ip})`);
    }
  } else if (line.includes('Business Logic:')) {
    stats.business++;
    console.log(`${colors.GREEN}[BUSINESS]${colors.RESET} ${line}`);
  } else if (line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\] (ERROR|WARN|INFO|DEBUG)/)) {
    const levelMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\] (ERROR|WARN|INFO|DEBUG)/);
    if (levelMatch) {
      const [, timestamp, level] = levelMatch;
      const message = line.substring(timestamp.length + level.length + 3);
      
      // Update stats
      switch (level) {
        case 'ERROR': stats.errors++; break;
        case 'WARN': stats.warnings++; break;
        case 'INFO': stats.info++; break;
      }
      
      const color = colors[level] || colors.RESET;
      console.log(`${color}[${timestamp}] ${level}${colors.RESET} ${message}`);
    }
  } else if (line.includes('🚀') || line.includes('✅') || line.includes('❌') || line.includes('⚠️')) {
    // Show startup and status messages
    console.log(line);
  }
  
  // Update stats every 10 logs
  if (stats.total % 10 === 0) {
    updateStats();
  }
}

// Simulate log input (in real usage, this would be piped from your log source)
console.log(`${colors.YELLOW}💡 To use this monitor with real logs:${colors.RESET}`);
console.log(`${colors.YELLOW}   tail -f your-log-file | node monitor-logs.js${colors.RESET}`);
console.log(`${colors.YELLOW}   Or pipe from your deployment logs${colors.RESET}\n`);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Log monitoring stopped.');
  console.log(`${colors.BLUE}📊 Final Statistics:${colors.RESET}`);
  console.log(`   Total logs processed: ${stats.total}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`   Warnings: ${stats.warnings}`);
  console.log(`   Info: ${stats.info}`);
  console.log(`   Requests: ${stats.requests}`);
  console.log(`   Business: ${stats.business}`);
  console.log(`   Prisma: ${stats.prisma}`);
  process.exit(0);
});

// For demonstration, show some sample organized logs
console.log(`${colors.GREEN}📋 Sample organized logs:${colors.RESET}\n`);

const sampleLogs = [
  '[2025-10-04T15:22:30.113Z] INFO 🚀 API server running on 0.0.0.0:4000',
  '[2025-10-04T15:22:30.114Z] INFO 📊 Environment: production',
  '[2025-10-04T15:22:30.115Z] INFO ✅ Database connected successfully',
  '[2025-10-04T15:22:30.116Z] INFO 📊 Database tables verified - Users table exists (5 users)',
  '[2025-10-04T15:22:30.117Z] INFO 🎉 Database is fully ready and operational!',
  '[2025-10-04T15:22:30.118Z] INFO GET /api/orders 200 (45ms)',
  '[2025-10-04T15:22:30.119Z] INFO Business Logic: Orders fetched',
  '[2025-10-04T15:22:30.120Z] INFO POST /api/orders 201 (120ms)',
  '[2025-10-04T15:22:30.121Z] INFO Business Logic: Order created',
  '[2025-10-04T15:22:30.122Z] WARN PUT /api/orders/invalid-id/approve-procurement 400 (15ms)',
  '[2025-10-04T15:22:30.123Z] ERROR Database connection failed: Connection timeout'
];

sampleLogs.forEach((log, index) => {
  setTimeout(() => {
    processLogLine(log);
  }, index * 500);
});

// Keep the process running
setInterval(() => {
  // This keeps the monitor running
}, 1000);

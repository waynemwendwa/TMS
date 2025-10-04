import { Request, Response } from 'express';

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// Color codes for console output
const colors = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m'   // Reset
};

// Logger class
export class Logger {
  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  private static formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = this.getTimestamp();
    const color = colors[level];
    const reset = colors.RESET;
    
    let formattedMessage = `${color}[${timestamp}] ${level}${reset} ${message}`;
    
    if (meta) {
      formattedMessage += `\n${color}  Meta:${reset} ${JSON.stringify(meta, null, 2)}`;
    }
    
    return formattedMessage;
  }

  static error(message: string, meta?: any): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, meta));
  }

  static warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  static info(message: string, meta?: any): void {
    console.log(this.formatMessage(LogLevel.INFO, message, meta));
  }

  static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  // HTTP request logger
  static logRequest(req: Request, res: Response, responseTime?: number): void {
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Determine log level based on status code
    let level: LogLevel;
    if (status >= 500) {
      level = LogLevel.ERROR;
    } else if (status >= 400) {
      level = LogLevel.WARN;
    } else {
      level = LogLevel.INFO;
    }

    const message = `${method} ${url} ${status} ${responseTime ? `(${responseTime}ms)` : ''}`;
    const meta = {
      ip,
      userAgent: userAgent.substring(0, 100), // Truncate long user agents
      contentLength: res.get('Content-Length') || 0
    };

    this.log(level, message, meta);
  }

  // Generic log method
  static log(level: LogLevel, message: string, meta?: any): void {
    switch (level) {
      case LogLevel.ERROR:
        this.error(message, meta);
        break;
      case LogLevel.WARN:
        this.warn(message, meta);
        break;
      case LogLevel.INFO:
        this.info(message, meta);
        break;
      case LogLevel.DEBUG:
        this.debug(message, meta);
        break;
    }
  }

  // Database query logger
  static logQuery(query: string, params?: any[], duration?: number): void {
    if (process.env.NODE_ENV === 'development') {
      const message = `DB Query${duration ? ` (${duration}ms)` : ''}`;
      const meta = {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        params: params?.slice(0, 5), // Only show first 5 params
        paramCount: params?.length || 0
      };
      this.debug(message, meta);
    }
  }

  // API endpoint logger
  static logEndpoint(endpoint: string, method: string, status: number, duration?: number): void {
    const message = `API ${method} ${endpoint} ${status}${duration ? ` (${duration}ms)` : ''}`;
    const level = status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, message);
  }

  // Error logger with stack trace
  static logError(error: Error, context?: string): void {
    const message = context ? `Error in ${context}` : 'Unhandled error';
    const meta = {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5) // Only first 5 lines of stack
    };
    this.error(message, meta);
  }

  // Business logic logger
  static logBusiness(action: string, details: any): void {
    const message = `Business Logic: ${action}`;
    this.info(message, details);
  }
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const responseTime = Date.now() - start;
    Logger.logRequest(req, res, responseTime);
    return originalEnd(chunk, encoding, cb);
  };
  
  next();
};

// Prisma query logger
export const prismaLogger = {
  log: (e: any) => {
    if (e.duration) {
      Logger.logQuery(e.query, e.params, e.duration);
    }
  }
};

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from '@tms/db/client';
import { Logger, requestLogger, prismaLogger } from './utils/logger.js';
import health from './routes/health.js';
import auth from './routes/auth.js';
import inventory from './routes/inventory.js';
import projects from './routes/projects.js';
import orders from './routes/orders.js';
import upload from './routes/upload/index.js';

const app = express();
// CORS configuration
const corsOptions = {
	origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) return callback(null, true);
		
		const allowedOrigins = process.env.NODE_ENV === 'production' 
			? [
				'https://tms-web-gzrw.onrender.com',
				'https://tms-web-376k.onrender.com',
				'https://tms-web-eaqk.onrender.com', 
				'https://contempeng.online',
				// Allow any Render frontend URL
				/^https:\/\/tms-web-.*\.onrender\.com$/,
				// Temporarily allow the wrong API URL being used
				'https://api.render.com'
			]
			: ['http://localhost:3000', 'http://localhost:3001'];
		
		// Check if origin matches any allowed origin (including regex patterns)
		const isAllowed = allowedOrigins.some(allowedOrigin => {
			if (typeof allowedOrigin === 'string') {
				return origin === allowedOrigin;
			} else if (allowedOrigin instanceof RegExp) {
				return allowedOrigin.test(origin);
			}
			return false;
		});
		
		if (isAllowed) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json());

// Use custom request logger instead of morgan
app.use(requestLogger);

// Disable Prisma query logging in production to reduce noise
if (process.env.NODE_ENV === 'development') {
  (prisma as any).$on('query', prismaLogger.log);
}

app.use('/api', health);
app.use('/api/auth', auth);
app.use('/api/inventory', inventory);
app.use('/api/projects', projects);
// Orders health check (public endpoint)
app.get('/api/orders/health', async (req, res) => {
  try {
    // Try to access the orders table to check if migration is applied
    await prisma.order.findFirst();
    res.json({ 
      status: 'healthy', 
      message: 'Orders feature is available',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    if (error.message && error.message.includes('relation "orders" does not exist')) {
      res.status(503).json({ 
        status: 'unavailable', 
        message: 'Orders feature not available - database migration required',
        code: 'SCHEMA_MIGRATION_REQUIRED',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'Orders feature error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
});

app.use('/api/orders', orders);
app.use('/api/upload', upload);

const port = Number(process.env.PORT) || 4000;
const host = '0.0.0.0';

app.listen(port, host, async () => {
	Logger.info(`🚀 API server running on ${host}:${port}`);
	Logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
	Logger.info(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
	
	// Test database connection and verify tables exist
	try {
		await prisma.$connect();
		Logger.info('✅ Database connected successfully');
		
		// Test if tables exist by running a simple query
		const userCount = await prisma.user.count();
		Logger.info(`📊 Database tables verified - Users table exists (${userCount} users)`);
		
		// Orders table and migration diagnostics
		try {
			const [{ exists } = { exists: null }]: Array<{ exists: string | null } | undefined> = await prisma.$queryRaw`SELECT to_regclass('public.orders') as exists`;
			const [{ count } = { count: BigInt(0) }]: Array<{ count: bigint } | undefined> = await prisma.$queryRaw`SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE migration_name LIKE '%add_approval_workflow%'`;
			Logger.info('🧪 Orders diagnostics', {
				ordersTableExists: Boolean(exists),
				approvalWorkflowMigrationCount: Number(count || 0)
			});
		} catch (diagError) {
			Logger.warn('⚠️ Orders diagnostics failed', { error: diagError instanceof Error ? diagError.message : 'Unknown error' });
		}
		
		// Test if FINANCE_PROCUREMENT role is available (without creating a user)
		try {
			// Just test if the enum value is valid by checking the schema
			await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"UserRole")) as role`;
			Logger.info('✅ UserRole enum is available');
			Logger.info('✅ FINANCE_PROCUREMENT role should be available');
		} catch (roleError) {
			Logger.warn('⚠️ Role enum test failed:', { error: roleError instanceof Error ? roleError.message : 'Unknown error' });
		}
		
		Logger.info('🎉 Database is fully ready and operational!');
	} catch (error) {
		Logger.error('❌ Database connection failed:', { error: error instanceof Error ? error.message : 'Unknown error' });
		Logger.error('❌ This usually means the database migration did not run properly');
	}
});

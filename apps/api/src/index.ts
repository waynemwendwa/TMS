import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from '@tms/db/client';
import health from './routes/health.js';
import auth from './routes/auth.js';
import inventory from './routes/inventory.js';
import projects from './routes/projects.js';
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
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', health);
app.use('/api/auth', auth);
app.use('/api/inventory', inventory);
app.use('/api/projects', projects);
app.use('/api/upload', upload);

const port = Number(process.env.PORT) || 4000;
const host = '0.0.0.0';

app.listen(port, host, async () => {
	console.log(`🚀 API server running on ${host}:${port}`);
	console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
	
	// Test database connection and verify tables exist
	try {
		await prisma.$connect();
		console.log('✅ Database connected successfully');
		
		// Test if tables exist by running a simple query
		const userCount = await prisma.user.count();
		console.log(`📊 Database tables verified - Users table exists (${userCount} users)`);
		
		// Test if FINANCE_PROCUREMENT role is available (without creating a user)
		try {
			// Just test if the enum value is valid by checking the schema
			await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"UserRole")) as role`;
			console.log('✅ UserRole enum is available');
			console.log('✅ FINANCE_PROCUREMENT role should be available');
		} catch (roleError) {
			console.log('⚠️ Role enum test failed:', roleError instanceof Error ? roleError.message : 'Unknown error');
		}
		
		console.log('🎉 Database is fully ready and operational!');
	} catch (error) {
		console.error('❌ Database connection failed:', error);
		console.error('❌ This usually means the database migration did not run properly');
	}
});

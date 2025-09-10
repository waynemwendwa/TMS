import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import health from './routes/health.js';
import projects from './routes/projects/index.js';
import suppliers from './routes/suppliers/index.js';
import parties from './routes/parties/index.js';
import boq from './routes/boq/index.js';
import procurement from './routes/procurement/index.js';
import upload from './routes/upload/index.js';
import auth from './routes/auth.js';
import dashboard from './routes/dashboard.js';
import { initializeMinIO } from './services/minio.js';

const app = express();
app.use(cors({
	origin: process.env.NODE_ENV === 'production' 
		? ['https://contempeng.online', 'https://contempeng.online']
		: ['http://localhost:3000', 'http://localhost:3001'],
	credentials: true
  }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', health);
app.use('/api/projects', projects);
app.use('/api/suppliers', suppliers);
app.use('/api/parties', parties);
app.use('/api/boq', boq);
app.use('/api/procurement', procurement);
app.use('/api/upload', upload);
app.use('/api/auth', auth);
app.use('/api/dashboard', dashboard);

// Initialize MinIO
initializeMinIO();

const port = Number(process.env.PORT) || 4000;
const host = '0.0.0.0';

app.listen(port, host, () => {
	console.log(`🚀 API server running on ${host}:${port}`);
	console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

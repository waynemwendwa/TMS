import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import health from './routes/health.js';
import auth from './routes/auth.js';
import inventory from './routes/inventory.js';
import upload from './routes/upload/index.js';

const app = express();
app.use(cors({
	origin: process.env.NODE_ENV === 'production' 
		? ['https://tms-web-eaqk.onrender.com', 'https://contempeng.online']
		: ['http://localhost:3000', 'http://localhost:3001'],
	credentials: true
  }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', health);
app.use('/api/auth', auth);
app.use('/api/inventory', inventory);
app.use('/api/upload', upload);

const port = Number(process.env.PORT) || 4000;
const host = '0.0.0.0';

app.listen(port, host, () => {
	console.log(`🚀 API server running on ${host}:${port}`);
	console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

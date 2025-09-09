import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import health from './routes/health';
import projects from './routes/projects';
import suppliers from './routes/suppliers';
import parties from './routes/parties';
import boq from './routes/boq';
import procurement from './routes/procurement';
import upload from './routes/upload';
import auth from './routes/auth';
import dashboard from './routes/dashboard';
import { initializeMinIO } from './services/minio';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
app.listen(port, () => {
	console.log(`API listening on http://localhost:${port}`);
});

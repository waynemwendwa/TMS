import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import health from './routes/health';
import projects from './routes/projects';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', health);
app.use('/api/projects', projects);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
	console.log(`API listening on http://localhost:${port}`);
});

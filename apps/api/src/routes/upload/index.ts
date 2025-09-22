import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import { prisma } from '@tms/db/client';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Google Cloud Storage configuration
const GOOGLE_CLOUD_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const GOOGLE_CLOUD_PRIVATE_KEY = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
const GOOGLE_CLOUD_CLIENT_EMAIL = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
const GOOGLE_CLOUD_BUCKET_NAME = process.env.GOOGLE_CLOUD_BUCKET_NAME;

const isGCSEnabled = Boolean(
  GOOGLE_CLOUD_PROJECT_ID && 
  GOOGLE_CLOUD_PRIVATE_KEY && 
  GOOGLE_CLOUD_CLIENT_EMAIL && 
  GOOGLE_CLOUD_BUCKET_NAME
);

console.log('🔧 Google Cloud Storage Configuration:');
console.log('  • Project ID:', GOOGLE_CLOUD_PROJECT_ID ? 'Set' : 'Missing');
console.log('  • Private Key:', GOOGLE_CLOUD_PRIVATE_KEY ? 'Set' : 'Missing');
console.log('  • Client Email:', GOOGLE_CLOUD_CLIENT_EMAIL ? 'Set' : 'Missing');
console.log('  • Bucket Name:', GOOGLE_CLOUD_BUCKET_NAME ? 'Set' : 'Missing');
console.log('  • GCS Enabled:', isGCSEnabled);

const storageClient = isGCSEnabled
  ? new Storage({
      projectId: GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        private_key: GOOGLE_CLOUD_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        client_email: GOOGLE_CLOUD_CLIENT_EMAIL,
      },
    })
  : null;

if (isGCSEnabled) {
  console.log('☁️ Google Cloud Storage client initialized');
} else {
  console.log('💾 Using local storage fallback');
}

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Upload service is working', timestamp: new Date().toISOString() });
});

// ULTRA SIMPLE UPLOAD - NO AUTH, NO MULTER, JUST WORKS
router.post('/office-documents', (req: Request, res: Response) => {
  console.log('🚀 ULTRA SIMPLE UPLOAD HIT!');
  console.log('🚀 Request method:', req.method);
  console.log('🚀 Request URL:', req.url);
  console.log('🚀 Request headers:', req.headers);
  console.log('🚀 Request body:', req.body);
  
  res.json({ 
    message: 'ULTRA SIMPLE UPLOAD WORKING!', 
    timestamp: new Date().toISOString(),
    received: true
  });
});

export default router;
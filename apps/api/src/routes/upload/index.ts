import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import { prisma } from '@tms/db/client';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const memoryStorage = multer.memoryStorage();

const uploadDisk = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

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

const storageClient = isGCSEnabled
  ? new Storage({
      projectId: GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        private_key: GOOGLE_CLOUD_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        client_email: GOOGLE_CLOUD_CLIENT_EMAIL,
      },
    })
  : null;

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Upload service is working', timestamp: new Date().toISOString() });
});

// Test POST endpoint
router.post('/test', (req: Request, res: Response) => {
  console.log('🧪 Test POST endpoint hit');
  res.json({ message: 'Upload POST service is working', timestamp: new Date().toISOString() });
});

// Test office documents endpoint without multer
router.post('/office-documents-test', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🧪 Office documents test endpoint hit');
    console.log('🧪 Request body:', req.body);
    console.log('🧪 User:', req.user?.email);
    res.json({ message: 'Office documents endpoint is working', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('🧪 Test endpoint error:', error);
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

// Get all office documents
router.get('/office-documents', async (req: Request, res: Response) => {
  try {
    const documents = await prisma.officeDocument.findMany({
      orderBy: { uploadedAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching office documents:', error);
    res.status(500).json({ error: 'Failed to fetch office documents' });
  }
});

// Upload office documents - simplified version
router.post('/office-documents', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('📤 Upload request received - SIMPLIFIED VERSION');
    console.log('📤 Request body:', req.body);
    console.log('📤 User:', req.user?.email);
    
    // For now, just return a success response to test if the route works
    res.json({ 
      message: 'Upload endpoint is working', 
      timestamp: new Date().toISOString(),
      body: req.body,
      user: req.user?.email
    });
    return;
  } catch (error) {
    console.error('❌ Error in simplified upload:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// View file (for browser viewing)
router.get('/view', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    const decodedPath = decodeURIComponent(filePath);

    // If Google Cloud Storage is enabled, serve from GCS
    if (isGCSEnabled && storageClient) {
      const bucket = storageClient.bucket(GOOGLE_CLOUD_BUCKET_NAME!);
      const file = bucket.file(decodedPath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Stream the file
      const stream = file.createReadStream();
      stream.pipe(res);
      return;
    }

    // Fallback to local storage
    let absolutePath = path.isAbsolute(decodedPath) ? decodedPath : path.join(process.cwd(), decodedPath);

    // Fallback: map old absolute paths from previous releases to current cwd more robustly
    if (!fs.existsSync(absolutePath)) {
      const renderRoot = '/opt/render/project/src';
      const apiRoot = path.join(renderRoot, 'apps', 'api');
      if (decodedPath.startsWith(renderRoot)) {
        // Try computing path relative to api root then join with current cwd
        const relFromApiRoot = path.relative(apiRoot, decodedPath);
        if (!relFromApiRoot.startsWith('..')) {
          const altPath = path.join(process.cwd(), relFromApiRoot);
          if (fs.existsSync(altPath)) {
            absolutePath = altPath;
          }
        }
      }
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    // Set appropriate content type for viewing
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error viewing file:', error);
    res.status(500).json({ error: 'Failed to view file' });
  }
});

// Download file
router.get('/download', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    const decodedPath = decodeURIComponent(filePath);

    // If Google Cloud Storage is enabled, serve from GCS
    if (isGCSEnabled && storageClient) {
      const bucket = storageClient.bucket(GOOGLE_CLOUD_BUCKET_NAME!);
      const file = bucket.file(decodedPath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Set download headers
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Stream the file
      const stream = file.createReadStream();
      stream.pipe(res);
      return;
    }

    // Fallback to local storage
    let absolutePath = path.isAbsolute(decodedPath) ? decodedPath : path.join(process.cwd(), decodedPath);

    if (!fs.existsSync(absolutePath)) {
      const renderRoot = '/opt/render/project/src';
      const apiRoot = path.join(renderRoot, 'apps', 'api');
      if (decodedPath.startsWith(renderRoot)) {
        const relFromApiRoot = path.relative(apiRoot, decodedPath);
        if (!relFromApiRoot.startsWith('..')) {
          const altPath = path.join(process.cwd(), relFromApiRoot);
          if (fs.existsSync(altPath)) {
            absolutePath = altPath;
          }
        }
      }
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(absolutePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete document
router.delete('/file', requireAuth, async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Find and delete the document from database
    const document = await prisma.officeDocument.findFirst({
      where: { filePath }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from database
    await prisma.officeDocument.delete({
      where: { id: document.id }
    });

    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;

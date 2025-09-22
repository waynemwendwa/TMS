import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import { prisma } from '@tms/db/client';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Configure multer for file uploads
const memoryStorage = multer.memoryStorage();

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

// Upload office documents with multer
router.post('/office-documents', requireAuth, uploadMemory.array('documents', 10), async (req: Request, res: Response) => {
  console.log('🚀 UPLOAD WITH MULTER HIT!');
  console.log('🚀 Request method:', req.method);
  console.log('🚀 Request URL:', req.url);
  console.log('🚀 Request headers:', req.headers);
  console.log('🚀 Request body:', req.body);
  console.log('🚀 Files:', req.files);
  console.log('🚀 Files type:', typeof req.files);
  console.log('🚀 Files length:', req.files ? (req.files as any).length : 'undefined');
  console.log('🚀 GCS enabled:', isGCSEnabled);
  console.log('🚀 User:', req.user?.email);
  
  try {
    const { category, name, description, tags } = req.body;
    const files = req.files as Express.Multer.File[];
    
    console.log('📤 Processing files...');
    console.log('📤 Files array:', files);
    console.log('📤 Files is array:', Array.isArray(files));
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.log('❌ No files uploaded or files not in expected format');
      console.log('❌ Files value:', files);
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!category || !name) {
      console.log('❌ Missing required fields:', { category, name });
      return res.status(400).json({ error: 'Category and name are required' });
    }

    console.log('📤 Processing', files.length, 'files');
    const uploadedDocuments = [];

    for (const file of files) {
      console.log('📤 Processing file:', file.originalname);
      console.log('📤 File size:', file.size);
      console.log('📤 File type:', file.mimetype);
      
      let storedFilePath = '';
      let fileUrl = '';

      if (isGCSEnabled && storageClient) {
        console.log('☁️ Uploading to Google Cloud Storage');
        const bucket = storageClient.bucket(GOOGLE_CLOUD_BUCKET_NAME!);
        const fileName = `office-documents/${Date.now()}-${file.originalname}`;
        const fileUpload = bucket.file(fileName);
        
        const stream = fileUpload.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        stream.on('error', (error) => {
          console.error('❌ GCS upload error:', error);
          throw error;
        });

        stream.on('finish', () => {
          console.log('✅ File uploaded to GCS:', fileName);
        });

        stream.end(file.buffer);
        
        storedFilePath = fileName;
        fileUrl = `https://storage.googleapis.com/${GOOGLE_CLOUD_BUCKET_NAME}/${fileName}`;
        console.log('☁️ GCS upload completed:', fileUrl);
      } else {
        console.log('💾 Saving to local storage');
        // Fallback to local storage - save file to disk
        const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
        const fullPath = path.join(uploadDir, fileName);
        
        console.log('💾 Writing file to:', fullPath);
        // Write buffer to file
        fs.writeFileSync(fullPath, file.buffer);
        
        const relativePath = path.relative(process.cwd(), fullPath);
        storedFilePath = relativePath;
        fileUrl = `/api/upload/view?filePath=${encodeURIComponent(storedFilePath)}`;
        console.log('💾 File saved successfully:', relativePath);
      }

      console.log('💾 Creating database record for:', file.originalname);
      const document = await prisma.officeDocument.create({
        data: {
          name: name || file.originalname,
          description: description || '',
          category: category as any,
          type: path.extname(file.originalname).toLowerCase().substring(1).toUpperCase() as any,
          size: file.size,
          url: fileUrl,
          filePath: storedFilePath,
          uploadedBy: req.user!.email,
          tags: tags ? JSON.parse(tags) : []
        }
      });
      uploadedDocuments.push(document);
      console.log('✅ Document created successfully:', document.id);
    }

    console.log('🎉 Upload completed successfully, documents:', uploadedDocuments.length);
    res.status(201).json(uploadedDocuments);
  } catch (error) {
    console.error('❌ Error uploading documents:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      error: 'Failed to upload documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
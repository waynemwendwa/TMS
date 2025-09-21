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

// Debug middleware for all upload routes
router.use((req: Request, res: Response, next: any) => {
  console.log('🔍 Upload route accessed:', req.method, req.path);
  console.log('🔍 Request headers:', req.headers);
  next();
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

// Test with basic multer (single file)
router.post('/office-documents-single', requireAuth, uploadMemory.single('documents'), async (req: Request, res: Response) => {
  try {
    console.log('🧪 Single file upload test');
    console.log('🧪 Request body:', req.body);
    console.log('🧪 File:', req.file);
    console.log('🧪 User:', req.user?.email);
    res.json({ 
      message: 'Single file upload test working', 
      timestamp: new Date().toISOString(),
      file: req.file ? { name: req.file.originalname, size: req.file.size } : null
    });
  } catch (error) {
    console.error('🧪 Single file test error:', error);
    res.status(500).json({ error: 'Single file test failed' });
  }
});

// Ultra-simple upload test (no multer, no auth)
router.post('/simple-test', (req: Request, res: Response) => {
  console.log('🧪 Ultra-simple test hit');
  console.log('🧪 Request body:', req.body);
  console.log('🧪 Request headers:', req.headers);
  res.json({ 
    message: 'Ultra-simple test working', 
    timestamp: new Date().toISOString(),
    body: req.body
  });
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

// Upload office documents - simplified approach
router.post('/office-documents', requireAuth, uploadMemory.array('documents', 10), async (req: Request, res: Response) => {
  console.log('📤 Upload request received - handler started');
  
  try {
    console.log('📤 Upload request received');
    console.log('📤 Request body:', req.body);
    console.log('📤 Files:', req.files);
    console.log('📤 Files type:', typeof req.files);
    console.log('📤 Files length:', req.files ? (req.files as any).length : 'undefined');
    console.log('📤 GCS enabled:', isGCSEnabled);
    console.log('📤 User:', req.user?.email);
    
    // Temporary: Just return success without processing files
    console.log('📤 Returning success without processing files');
    return res.status(200).json({ 
      message: 'Upload endpoint reached successfully', 
      files: req.files ? (req.files as any).length : 0,
      body: req.body
    });
    
    // Commented out for debugging - will restore after confirming endpoint works
    /*
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

    const uploadedDocuments = [];
    
    for (const file of files) {
      console.log('📁 Processing file:', file.originalname, 'Size:', file.size);
      let storedFilePath: string;
      let fileUrl: string;

      if (isGCSEnabled && storageClient) {
        console.log('☁️ Uploading to Google Cloud Storage');
        // Upload to Google Cloud Storage
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
        const gcsPath = `uploads/documents/${fileName}`;
        
        const bucket = storageClient.bucket(GOOGLE_CLOUD_BUCKET_NAME!);
        const gcsFile = bucket.file(gcsPath);
        
        await gcsFile.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
        });

        // Make the file publicly accessible
        await gcsFile.makePublic();
        
        storedFilePath = gcsPath; // store GCS path in DB
        fileUrl = `https://storage.googleapis.com/${GOOGLE_CLOUD_BUCKET_NAME}/${gcsPath}`;
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
    */
  } catch (error) {
    console.error('❌ Error uploading documents:', error);
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

// Global error handler for upload routes
router.use((error: any, req: Request, res: Response, next: any) => {
  console.error('❌ Upload route error:', error);
  res.status(500).json({ error: 'Upload route error: ' + (error.message || 'Unknown error') });
});

export default router;

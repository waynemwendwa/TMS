import { Router, Request, Response } from 'express';
import multer from 'multer';
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

const upload = multer({
  storage: storage,
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

// Upload office documents
router.post('/office-documents', requireAuth, upload.array('documents', 10), async (req: Request, res: Response) => {
  try {
    const { category, name, description, tags } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!category || !name) {
      return res.status(400).json({ error: 'Category and name are required' });
    }

    const uploadedDocuments = [];
    
    for (const file of files) {
      if (!file.path) {
        throw new Error('File path is undefined');
      }
      
      const relativePath = path.relative(process.cwd(), file.path);
      const document = await prisma.officeDocument.create({
        data: {
          name: name || file.originalname,
          description: description || '',
          category: category as any,
          type: path.extname(file.originalname).toLowerCase().substring(1).toUpperCase() as any,
          size: file.size,
          url: `/api/upload/view?filePath=${encodeURIComponent(relativePath)}`,
          filePath: relativePath,
          uploadedBy: req.user!.email, // Use email since name is not in JwtUserPayload
          tags: tags ? JSON.parse(tags) : []
        }
      });
      uploadedDocuments.push(document);
    }

    res.status(201).json(uploadedDocuments);
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// View file (for browser viewing)
router.get('/view', (req: Request, res: Response) => {
  try {
    const { filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    const decodedPath = decodeURIComponent(filePath);
    let absolutePath = path.isAbsolute(decodedPath) ? decodedPath : path.join(process.cwd(), decodedPath);

    // Fallback: map old absolute paths from previous releases to current cwd
    if (!fs.existsSync(absolutePath)) {
      const renderPrefix = '/opt/render/project/src/';
      if (decodedPath.startsWith(renderPrefix)) {
        const relFromRenderRoot = decodedPath.substring(renderPrefix.length);
        const altPath = path.join(process.cwd(), relFromRenderRoot);
        if (fs.existsSync(altPath)) {
          absolutePath = altPath;
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
router.get('/download', (req: Request, res: Response) => {
  try {
    const { filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    const decodedPath = decodeURIComponent(filePath);
    let absolutePath = path.isAbsolute(decodedPath) ? decodedPath : path.join(process.cwd(), decodedPath);

    if (!fs.existsSync(absolutePath)) {
      const renderPrefix = '/opt/render/project/src/';
      if (decodedPath.startsWith(renderPrefix)) {
        const relFromRenderRoot = decodedPath.substring(renderPrefix.length);
        const altPath = path.join(process.cwd(), relFromRenderRoot);
        if (fs.existsSync(altPath)) {
          absolutePath = altPath;
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

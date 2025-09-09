import { Router } from 'express';
import { uploadSingle, uploadMultiple, handleUploadError } from '../../middleware/upload';
import { uploadFile, deleteFile, getFileUrl, listFiles } from '../../services/minio';
import { prisma } from '@tms/db/client';

const router = Router();

// Upload single file (for BOQ documents)
router.post('/single', uploadSingle('file'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { folder = 'boq', projectId, boqId } = req.body;
    
    // Upload file to MinIO
    const uploadResult = await uploadFile(req.file, folder);
    
    // If BOQ ID is provided, update the BOQ record
    if (boqId) {
      const boq = await prisma.bOQ.update({
        where: { id: boqId },
        data: {
          documentPath: uploadResult.path,
          documentType: req.file.mimetype.startsWith('image/') ? 'image' : 'document',
          fileName: req.file.originalname,
        },
      });
      
      return res.json({
        success: true,
        file: {
          id: uploadResult.path,
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
          path: uploadResult.path,
          url: uploadResult.url,
        },
        boq,
      });
    }
    
    res.json({
      success: true,
      file: {
        id: uploadResult.path,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        path: uploadResult.path,
        url: uploadResult.url,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Upload multiple files
router.post('/multiple', uploadMultiple('files', 5), handleUploadError, async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { folder = 'uploads' } = req.body;
    const uploadResults = [];

    for (const file of files) {
      const uploadResult = await uploadFile(file, folder);
      uploadResults.push({
        id: uploadResult.path,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        path: uploadResult.path,
        url: uploadResult.url,
      });
    }

    res.json({
      success: true,
      files: uploadResults,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Delete file
router.delete('/file', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    await deleteFile(filePath);
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get file URL
router.get('/url', async (req, res) => {
  try {
    const { filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const url = getFileUrl(filePath);
    
    res.json({ url });
  } catch (error) {
    console.error('Error getting file URL:', error);
    res.status(500).json({ error: 'Failed to get file URL' });
  }
});

// List files in a folder
router.get('/list', async (req, res) => {
  try {
    const { folder = '' } = req.query;
    const files = await listFiles(folder as string);
    
    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Upload BOQ documents specifically
router.post('/boq', uploadMultiple('boqFiles', 2), handleUploadError, async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { projectId, boqType } = req.body; // 'priced' or 'unpriced'
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No BOQ files uploaded' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const uploadResults = [];

    for (const file of files) {
      const folder = `boq/${projectId}/${boqType || 'general'}`;
      const uploadResult = await uploadFile(file, folder);
      
      uploadResults.push({
        id: uploadResult.path,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        path: uploadResult.path,
        url: uploadResult.url,
        boqType: boqType || 'general',
      });
    }

    res.json({
      success: true,
      boqFiles: uploadResults,
      projectId,
    });
  } catch (error) {
    console.error('Error uploading BOQ files:', error);
    res.status(500).json({ error: 'Failed to upload BOQ files' });
  }
});

//upload office documents
router.post(
  '/office-documents',
  uploadMultiple('documents', 10), // 'documents' matches your frontend FormData key
  handleUploadError,
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { name, description, category, tags } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No documents uploaded' });
      }

      const uploadResults = [];

      for (const file of files) {
        // Save to MinIO (or your storage)
        const uploadResult = await uploadFile(file, 'office-documents');
        // Optionally, save metadata to DB here using prisma
        uploadResults.push({
          id: uploadResult.path,
          name: name || file.originalname,
          description,
          category,
          tags: tags ? JSON.parse(tags) : [],
          size: file.size,
          type: file.mimetype,
          path: uploadResult.path,
          url: uploadResult.url,
          uploadedAt: new Date().toISOString(),
        });
      }

      res.json(uploadResults);
    } catch (error) {
      console.error('Error uploading office documents:', error);
      res.status(500).json({ error: 'Failed to upload office documents' });
    }
  }
);

export default router;

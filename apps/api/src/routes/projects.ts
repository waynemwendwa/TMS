import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';
import { Prisma } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// ---- Project Documents Upload Setup ----
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Place under uploads/project-documents/<projectId>
    const projectId = (req.params as any)?.id || 'unassigned';
    const uploadDir = path.join(process.cwd(), 'uploads', 'project-documents', projectId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const projectUpload = multer({
  storage: projectStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed'));
  }
});

// Get all projects
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        stakeholders: true,
        _count: {
          select: {
            documents: true,
            procurementItems: true,
            projectPhases: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        stakeholders: true,
        documents: true,
        procurementItems: true,
        projectPhases: {
          orderBy: { weekNumber: 'asc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, estimatedDuration } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        estimatedDuration,
        createdBy: req.user!.id,
        status: 'TO_START'
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, startDate, endDate, estimatedDuration } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        estimatedDuration
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        stakeholders: true,
        _count: {
          select: {
            documents: true,
            procurementItems: true,
            projectPhases: true
          }
        }
      }
    });

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Add stakeholder to project
router.post('/:id/stakeholders', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, location, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    const stakeholder = await prisma.projectStakeholder.create({
      data: {
        projectId: id,
        name,
        email,
        phone,
        location,
        role
      }
    });

    res.status(201).json(stakeholder);
  } catch (error) {
    console.error('Error adding stakeholder:', error);
    res.status(500).json({ error: 'Failed to add stakeholder' });
  }
});

// Update stakeholder
router.put('/stakeholders/:stakeholderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { stakeholderId } = req.params;
    const { name, email, phone, location, role } = req.body;

    const stakeholder = await prisma.projectStakeholder.update({
      where: { id: stakeholderId },
      data: {
        name,
        email,
        phone,
        location,
        role
      }
    });

    res.json(stakeholder);
  } catch (error) {
    console.error('Error updating stakeholder:', error);
    res.status(500).json({ error: 'Failed to update stakeholder' });
  }
});

// Delete stakeholder
router.delete('/stakeholders/:stakeholderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { stakeholderId } = req.params;

    await prisma.projectStakeholder.delete({
      where: { id: stakeholderId }
    });

    res.json({ message: 'Stakeholder deleted successfully' });
  } catch (error) {
    console.error('Error deleting stakeholder:', error);
    res.status(500).json({ error: 'Failed to delete stakeholder' });
  }
});

export default router;

// ---- Project Documents Endpoints ----

// List project documents (optionally filter by documentType or category)
router.get('/:id/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentType, category } = req.query as { documentType?: string; category?: string };

    const documents = await prisma.projectDocument.findMany({
      where: {
        projectId: id,
        ...(documentType ? { documentType } : {}),
        ...(category ? { category: category as any } : {})
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching project documents:', error);
    res.status(500).json({ error: 'Failed to fetch project documents' });
  }
});

// Upload project documents (preliminary or BOQ)
router.post('/:id/documents', requireAuth, projectUpload.array('documents', 10), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, name, description, documentType } = req.body as {
      category?: string;
      name?: string;
      description?: string;
      documentType?: string; // "preliminary" | "boq"
    };

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!documentType) {
      return res.status(400).json({ error: 'documentType is required (preliminary|boq)' });
    }

    const uploaded: any[] = [];
    for (const file of files) {
      if (!file.path) throw new Error('File path is undefined');

      const created = await prisma.projectDocument.create({
        data: {
          projectId: id,
          name: name || file.originalname,
          description: description || '',
          category: (category as any) || 'OTHER',
          type: path.extname(file.originalname).toLowerCase().substring(1).toUpperCase() as any,
          size: file.size,
          url: `/api/upload/view?filePath=${encodeURIComponent(file.path)}`,
          filePath: file.path,
          uploadedBy: req.user!.id,
          documentType
        }
      });
      uploaded.push(created);
    }

    res.status(201).json(uploaded);
  } catch (error) {
    console.error('Error uploading project documents:', error);
    res.status(500).json({ error: 'Failed to upload project documents' });
  }
});

// Delete a project document
router.delete('/documents/:docId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const doc = await prisma.projectDocument.findUnique({ where: { id: docId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await prisma.projectDocument.delete({ where: { id: docId } });
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      try { fs.unlinkSync(doc.filePath); } catch {}
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project document:', error);
    res.status(500).json({ error: 'Failed to delete project document' });
  }
});

// ---- Procurement Items ----

// List procurement items for a project
router.get('/:id/procurements', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const items = await prisma.procurementItem.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching procurement items:', error);
    res.status(500).json({ error: 'Failed to fetch procurement items' });
  }
});

// Create procurement item
router.post('/:id/procurements', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemName, description, quantity, unit, estimatedCost } = req.body as {
      itemName: string;
      description?: string;
      quantity: number;
      unit: string;
      estimatedCost?: string;
    };

    if (!itemName || !quantity || !unit) {
      return res.status(400).json({ error: 'itemName, quantity and unit are required' });
    }

    const created = await prisma.procurementItem.create({
      data: {
        projectId: id,
        itemName,
        description,
        quantity: Number(quantity),
        unit,
        estimatedCost: estimatedCost ? new Prisma.Decimal(estimatedCost) : undefined,
      }
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating procurement item:', error);
    res.status(500).json({ error: 'Failed to create procurement item' });
  }
});

// Update procurement item
router.put('/procurements/:procurementId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { procurementId } = req.params;
    const { itemName, description, quantity, unit, estimatedCost, status, actualCost, supplierId } = req.body as any;

    const updated = await prisma.procurementItem.update({
      where: { id: procurementId },
      data: {
        itemName,
        description,
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        unit,
        estimatedCost: estimatedCost !== undefined ? new Prisma.Decimal(estimatedCost) : undefined,
        actualCost: actualCost !== undefined ? new Prisma.Decimal(actualCost) : undefined,
        supplierId,
        status
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating procurement item:', error);
    res.status(500).json({ error: 'Failed to update procurement item' });
  }
});

// Delete procurement item
router.delete('/procurements/:procurementId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { procurementId } = req.params;
    await prisma.procurementItem.delete({ where: { id: procurementId } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting procurement item:', error);
    res.status(500).json({ error: 'Failed to delete procurement item' });
  }
});

// ---- Project Phases ----

// List phases for a project
router.get('/:id/phases', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const phases = await prisma.projectPhase.findMany({
      where: { projectId: id },
      orderBy: { weekNumber: 'asc' }
    });
    res.json(phases);
  } catch (error) {
    console.error('Error fetching project phases:', error);
    res.status(500).json({ error: 'Failed to fetch project phases' });
  }
});

// Create phase
router.post('/:id/phases', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phaseName, description, startDate, endDate, status, weekNumber, tasks, materials } = req.body as any;

    if (!phaseName || weekNumber === undefined) {
      return res.status(400).json({ error: 'phaseName and weekNumber are required' });
    }

    const created = await prisma.projectPhase.create({
      data: {
        projectId: id,
        phaseName,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        weekNumber: Number(weekNumber),
        tasks: Array.isArray(tasks) ? tasks : tasks ? String(tasks).split(',').map((s) => s.trim()).filter(Boolean) : [],
        materials: Array.isArray(materials) ? materials : materials ? String(materials).split(',').map((s) => s.trim()).filter(Boolean) : []
      }
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating project phase:', error);
    res.status(500).json({ error: 'Failed to create project phase' });
  }
});

// Update phase
router.put('/phases/:phaseId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phaseId } = req.params;
    const { phaseName, description, startDate, endDate, status, weekNumber, tasks, materials } = req.body as any;

    const updated = await prisma.projectPhase.update({
      where: { id: phaseId },
      data: {
        phaseName,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        weekNumber: weekNumber !== undefined ? Number(weekNumber) : undefined,
        tasks: tasks !== undefined ? (Array.isArray(tasks) ? tasks : String(tasks).split(',').map((s) => s.trim()).filter(Boolean)) : undefined,
        materials: materials !== undefined ? (Array.isArray(materials) ? materials : String(materials).split(',').map((s) => s.trim()).filter(Boolean)) : undefined
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating project phase:', error);
    res.status(500).json({ error: 'Failed to update project phase' });
  }
});

// Delete phase
router.delete('/phases/:phaseId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { phaseId } = req.params;
    await prisma.projectPhase.delete({ where: { id: phaseId } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project phase:', error);
    res.status(500).json({ error: 'Failed to delete project phase' });
  }
});

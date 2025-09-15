import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

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

import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

// Get all projects
router.get('/', async (_req: Request, res: Response) => {
	try {
		const projects = await prisma.project.findMany({
			orderBy: { createdAt: 'desc' }
		});
		res.json(projects);
	} catch (error) {
		console.error('Error fetching projects:', error);
		res.status(500).json({ error: 'Failed to fetch projects' });
	}
});

// Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const project = await prisma.project.findUnique({
			where: { id }
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
router.post('/', requireAuth, requireRole('SITE_SUPERVISOR', 'CHAIRMAN', 'CHAIRMAN_PA'), async (req: Request, res: Response) => {
	try {
		const { 
			title, 
			description, 
			startDate, 
			endDate,
			// Bio data
			mainContractor,
			client,
			architect,
			engineer,
			quantitySurveyor,
			structuralEngineer,
			subcontractors,
			lawFirm,
			// Contact information
			contractorContact,
			clientContact,
			architectContact,
			engineerContact,
			qsContact,
			structuralContact,
			subcontractorContact,
			lawFirmContact
		} = req.body;
		
		if (!title) {
			return res.status(400).json({ error: 'Project title is required' });
		}
		
		const parsedStartDate = startDate ? new Date(startDate) : undefined;
		const parsedEndDate = endDate ? new Date(endDate) : undefined;

		const project = await prisma.project.create({
			data: { 
				title,
				description: description ?? undefined,
				startDate: parsedStartDate,
				endDate: parsedEndDate,
				mainContractor: mainContractor ?? undefined,
				client: client ?? undefined,
				architect: architect ?? undefined,
				engineer: engineer ?? undefined,
				quantitySurveyor: quantitySurveyor ?? undefined,
				structuralEngineer: structuralEngineer ?? undefined,
				subcontractors: subcontractors ?? undefined,
				lawFirm: lawFirm ?? undefined,
				contractorContact: contractorContact ?? undefined,
				clientContact: clientContact ?? undefined,
				architectContact: architectContact ?? undefined,
				engineerContact: engineerContact ?? undefined,
				qsContact: qsContact ?? undefined,
				structuralContact: structuralContact ?? undefined,
				subcontractorContact: subcontractorContact ?? undefined,
				lawFirmContact: lawFirmContact ?? undefined,
				createdBy: req.user!.id
			}
		});
		
		res.status(201).json(project);
	} catch (error) {
		console.error('Error creating project:', error);
		res.status(500).json({ error: 'Failed to create project' });
	}
});

// Update project
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { title } = req.body;
		
		if (!title) {
			return res.status(400).json({ error: 'Project title is required' });
		}
		
		const project = await prisma.project.update({
			where: { id },
			data: { title }
		});
		
		res.json(project);
	} catch (error) {
		console.error('Error updating project:', error);
		res.status(500).json({ error: 'Failed to update project' });
	}
});

// Delete project
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		await prisma.project.delete({
			where: { id }
		});
		
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting project:', error);
		res.status(500).json({ error: 'Failed to delete project' });
	}
});

export default router;

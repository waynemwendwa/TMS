import { Router } from 'express';
import { prisma } from '@tms/db/client';

const router = Router();

// Get all projects
router.get('/', async (_req, res) => {
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
router.get('/:id', async (req, res) => {
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
router.post('/', async (req, res) => {
	try {
		const { name } = req.body;
		
		if (!name) {
			return res.status(400).json({ error: 'Project name is required' });
		}
		
		const project = await prisma.project.create({
			data: { name }
		});
		
		res.status(201).json(project);
	} catch (error) {
		console.error('Error creating project:', error);
		res.status(500).json({ error: 'Failed to create project' });
	}
});

// Update project
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name } = req.body;
		
		if (!name) {
			return res.status(400).json({ error: 'Project name is required' });
		}
		
		const project = await prisma.project.update({
			where: { id },
			data: { name }
		});
		
		res.json(project);
	} catch (error) {
		console.error('Error updating project:', error);
		res.status(500).json({ error: 'Failed to update project' });
	}
});

// Delete project
router.delete('/:id', async (req, res) => {
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

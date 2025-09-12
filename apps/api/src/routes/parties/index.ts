import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';

const router = Router();

// Get all parties for a project
router.get('/project/:projectId', async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;
		const parties = await prisma.party.findMany({
			where: { projectId },
			orderBy: { type: 'asc' }
		});
		res.json(parties);
	} catch (error) {
		console.error('Error fetching parties:', error);
		res.status(500).json({ error: 'Failed to fetch parties' });
	}
});

// Get party by ID
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const party = await prisma.party.findUnique({
			where: { id }
		});
		
		if (!party) {
			return res.status(404).json({ error: 'Party not found' });
		}
		
		res.json(party);
	} catch (error) {
		console.error('Error fetching party:', error);
		res.status(500).json({ error: 'Failed to fetch party' });
	}
});

// Create new party
router.post('/', async (req: Request, res: Response) => {
	try {
		const { name, type, email, phone, poBox, address, website, taxNumber, projectId } = req.body;
		
		if (!name || !type || !email || !phone || !projectId) {
			return res.status(400).json({ error: 'Name, type, email, phone, and projectId are required' });
		}
		
		const party = await prisma.party.create({
			data: { name, type, email, phone, poBox, address, website, taxNumber, projectId }
		});
		
		res.status(201).json(party);
	} catch (error) {
		console.error('Error creating party:', error);
		res.status(500).json({ error: 'Failed to create party' });
	}
});

// Update party
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name, type, email, phone, poBox, address, website, taxNumber } = req.body;
		
		if (!name || !type || !email || !phone) {
			return res.status(400).json({ error: 'Name, type, email, and phone are required' });
		}
		
		const party = await prisma.party.update({
			where: { id },
			data: { name, type, email, phone, poBox, address, website, taxNumber }
		});
		
		res.json(party);
	} catch (error) {
		console.error('Error updating party:', error);
		res.status(500).json({ error: 'Failed to update party' });
	}
});

// Delete party
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		await prisma.party.delete({
			where: { id }
		});
		
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting party:', error);
		res.status(500).json({ error: 'Failed to delete party' });
	}
});

// Get parties by type for a project
router.get('/project/:projectId/type/:type', async (req: Request, res: Response) => {
	try {
		const { projectId, type } = req.params;
		const parties = await prisma.party.findMany({
			where: { 
				projectId,
				type: type as any
			},
			orderBy: { name: 'asc' }
		});
		res.json(parties);
	} catch (error) {
		console.error('Error fetching parties by type:', error);
		res.status(500).json({ error: 'Failed to fetch parties by type' });
	}
});

export default router;

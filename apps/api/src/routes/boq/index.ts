import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';

const router = Router();

// Get all BOQs for a project
router.get('/project/:projectId', async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;
		const boqs = await prisma.bOQ.findMany({
			where: { projectId },
			include: {
				items: true
			},
			orderBy: { createdAt: 'desc' }
		});
		res.json(boqs);
	} catch (error) {
		console.error('Error fetching BOQs:', error);
		res.status(500).json({ error: 'Failed to fetch BOQs' });
	}
});

// Get BOQ by ID with items
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const boq = await prisma.bOQ.findUnique({
			where: { id },
			include: {
				items: true
			}
		});
		
		if (!boq) {
			return res.status(404).json({ error: 'BOQ not found' });
		}
		
		res.json(boq);
	} catch (error) {
		console.error('Error fetching BOQ:', error);
		res.status(500).json({ error: 'Failed to fetch BOQ' });
	}
});

// Create new BOQ
router.post('/', async (req: Request, res: Response) => {
	try {
		const { name, version, isPriced, projectId, items, documentPath, documentType, fileName } = req.body;
		
		if (!name || !projectId) {
			return res.status(400).json({ error: 'Name and projectId are required' });
		}
		
		const boq = await prisma.bOQ.create({
			data: {
				name,
				version: version || '1.0',
				isPriced: isPriced || false,
				projectId,
				documentPath,
				documentType,
				fileName,
				items: {
					create: items || []
				}
			},
			include: {
				items: true
			}
		});
		
		res.status(201).json(boq);
	} catch (error) {
		console.error('Error creating BOQ:', error);
		res.status(500).json({ error: 'Failed to create BOQ' });
	}
});

// Update BOQ
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name, version, isPriced } = req.body;
		
		if (!name) {
			return res.status(400).json({ error: 'Name is required' });
		}
		
		const boq = await prisma.bOQ.update({
			where: { id },
			data: { name, version, isPriced }
		});
		
		res.json(boq);
	} catch (error) {
		console.error('Error updating BOQ:', error);
		res.status(500).json({ error: 'Failed to update BOQ' });
	}
});

// Delete BOQ
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		await prisma.bOQ.delete({
			where: { id }
		});
		
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting BOQ:', error);
		res.status(500).json({ error: 'Failed to delete BOQ' });
	}
});

// Add item to BOQ
router.post('/:id/items', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { itemCode, description, unit, quantity, unitPrice, remarks } = req.body;
		
		if (!itemCode || !description || !unit || !quantity) {
			return res.status(400).json({ error: 'Item code, description, unit, and quantity are required' });
		}
		
		const item = await prisma.bOQItem.create({
			data: {
				itemCode,
				description,
				unit,
				quantity: parseFloat(quantity),
				unitPrice: unitPrice ? parseFloat(unitPrice) : null,
				remarks,
				boqId: id
			}
		});
		
		res.status(201).json(item);
	} catch (error) {
		console.error('Error adding BOQ item:', error);
		res.status(500).json({ error: 'Failed to add BOQ item' });
	}
});

// Update BOQ item
router.put('/items/:itemId', async (req: Request, res: Response) => {
	try {
		const { itemId } = req.params;
		const { itemCode, description, unit, quantity, unitPrice, remarks } = req.body;
		
		if (!itemCode || !description || !unit || !quantity) {
			return res.status(400).json({ error: 'Item code, description, unit, and quantity are required' });
		}
		
		const item = await prisma.bOQItem.update({
			where: { id: itemId },
			data: {
				itemCode,
				description,
				unit,
				quantity: parseFloat(quantity),
				unitPrice: unitPrice ? parseFloat(unitPrice) : null,
				remarks
			}
		});
		
		res.json(item);
	} catch (error) {
		console.error('Error updating BOQ item:', error);
		res.status(500).json({ error: 'Failed to update BOQ item' });
	}
});

// Delete BOQ item
router.delete('/items/:itemId', async (req: Request, res: Response) => {
	try {
		const { itemId } = req.params;
		await prisma.bOQItem.delete({
			where: { id: itemId }
		});
		
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting BOQ item:', error);
		res.status(500).json({ error: 'Failed to delete BOQ item' });
	}
});

export default router;

import { Router } from 'express';
import { prisma } from '@tms/db/client';

const router = Router();

// Get all procurement plans for a project
router.get('/project/:projectId', async (req, res) => {
	try {
		const { projectId } = req.params;
		const procurementPlans = await prisma.procurementPlan.findMany({
			where: { projectId },
			include: {
				items: {
					include: {
						supplier: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});
		res.json(procurementPlans);
	} catch (error) {
		console.error('Error fetching procurement plans:', error);
		res.status(500).json({ error: 'Failed to fetch procurement plans' });
	}
});

// Get procurement plan by ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const procurementPlan = await prisma.procurementPlan.findUnique({
			where: { id },
			include: {
				items: {
					include: {
						supplier: true
					}
				},
				sampleApprovals: true
			}
		});
		
		if (!procurementPlan) {
			return res.status(404).json({ error: 'Procurement plan not found' });
		}
		
		res.json(procurementPlan);
	} catch (error) {
		console.error('Error fetching procurement plan:', error);
		res.status(500).json({ error: 'Failed to fetch procurement plan' });
	}
});

// Create new procurement plan
router.post('/', async (req, res) => {
	try {
		const { name, description, projectId, items } = req.body;
		
		if (!name || !projectId) {
			return res.status(400).json({ error: 'Name and projectId are required' });
		}
		
		const procurementPlan = await prisma.procurementPlan.create({
			data: {
				name,
				description,
				projectId,
				items: {
					create: items || []
				}
			},
			include: {
				items: {
					include: {
						supplier: true
					}
				}
			}
		});
		
		res.status(201).json(procurementPlan);
	} catch (error) {
		console.error('Error creating procurement plan:', error);
		res.status(500).json({ error: 'Failed to create procurement plan' });
	}
});

// Update procurement plan
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, status } = req.body;
		
		if (!name) {
			return res.status(400).json({ error: 'Name is required' });
		}
		
		const procurementPlan = await prisma.procurementPlan.update({
			where: { id },
			data: { name, description, status }
		});
		
		res.json(procurementPlan);
	} catch (error) {
		console.error('Error updating procurement plan:', error);
		res.status(500).json({ error: 'Failed to update procurement plan' });
	}
});

// Delete procurement plan
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		await prisma.procurementPlan.delete({
			where: { id }
		});
		
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting procurement plan:', error);
		res.status(500).json({ error: 'Failed to delete procurement plan' });
	}
});

// Add item to procurement plan
router.post('/:id/items', async (req, res) => {
	try {
		const { id } = req.params;
		const { itemCode, description, specification, unit, quantity, marketPrice, supplierId, remarks } = req.body;
		
		if (!itemCode || !description || !unit || !quantity || !marketPrice) {
			return res.status(400).json({ error: 'Item code, description, unit, quantity, and market price are required' });
		}
		
		const item = await prisma.procurementItem.create({
			data: {
				itemCode,
				description,
				specification,
				unit,
				quantity: parseFloat(quantity),
				marketPrice: parseFloat(marketPrice),
				supplierId,
				remarks,
				procurementPlanId: id
			},
			include: {
				supplier: true
			}
		});
		
		res.status(201).json(item);
	} catch (error) {
		console.error('Error adding procurement item:', error);
		res.status(500).json({ error: 'Failed to add procurement item' });
	}
});

// Update procurement item
router.put('/items/:itemId', async (req, res) => {
	try {
		const { itemId } = req.params;
		const { itemCode, description, specification, unit, quantity, marketPrice, tenderedPrice, supplierId, remarks } = req.body;
		
		if (!itemCode || !description || !unit || !quantity || !marketPrice) {
			return res.status(400).json({ error: 'Item code, description, unit, quantity, and market price are required' });
		}
		
		const item = await prisma.procurementItem.update({
			where: { id: itemId },
			data: {
				itemCode,
				description,
				specification,
				unit,
				quantity: parseFloat(quantity),
				marketPrice: parseFloat(marketPrice),
				tenderedPrice: tenderedPrice ? parseFloat(tenderedPrice) : null,
				supplierId,
				remarks
			},
			include: {
				supplier: true
			}
		});
		
		res.json(item);
	} catch (error) {
		console.error('Error updating procurement item:', error);
		res.status(500).json({ error: 'Failed to update procurement item' });
	}
});

// Delete procurement item
router.delete('/items/:itemId', async (req, res) => {
	try {
		const { itemId } = req.params;
		await prisma.procurementItem.delete({
			where: { id: itemId }
		});
		
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting procurement item:', error);
		res.status(500).json({ error: 'Failed to delete procurement item' });
	}
});

// Generate sample approval form
router.post('/:id/sample-approval', async (req, res) => {
	try {
		const { id } = req.params;
		const { title, description, supplierId } = req.body;
		
		if (!title || !supplierId) {
			return res.status(400).json({ error: 'Title and supplierId are required' });
		}
		
		const procurementPlan = await prisma.procurementPlan.findUnique({
			where: { id },
			include: { project: true }
		});
		
		if (!procurementPlan) {
			return res.status(404).json({ error: 'Procurement plan not found' });
		}
		
		const sampleApproval = await prisma.sampleApproval.create({
			data: {
				title,
				description,
				supplierId,
				projectId: procurementPlan.projectId,
				procurementPlanId: id
			},
			include: {
				supplier: true,
				project: true
			}
		});
		
		res.status(201).json(sampleApproval);
	} catch (error) {
		console.error('Error creating sample approval:', error);
		res.status(500).json({ error: 'Failed to create sample approval' });
	}
});

export default router;










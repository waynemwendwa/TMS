import { Router } from 'express';
import { prisma } from '@tms/db/client';

const router = Router();

// Get all suppliers
router.get('/', async (_req, res) => {
	try {
		const suppliers = await prisma.supplier.findMany({
			where: { isActive: true },
			orderBy: { name: 'asc' }
		});
		res.json(suppliers);
	} catch (error) {
		console.error('Error fetching suppliers:', error);
		res.status(500).json({ error: 'Failed to fetch suppliers' });
	}
});

// Get supplier by ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const supplier = await prisma.supplier.findUnique({
			where: { id }
		});
		
		if (!supplier) {
			return res.status(404).json({ error: 'Supplier not found' });
		}
		
		res.json(supplier);
	} catch (error) {
		console.error('Error fetching supplier:', error);
		res.status(500).json({ error: 'Failed to fetch supplier' });
	}
});

// Create new supplier
router.post('/', async (req, res) => {
	try {
		const { name, email, phone, poBox, address, website, taxNumber } = req.body;
		
		if (!name || !email || !phone) {
			return res.status(400).json({ error: 'Name, email, and phone are required' });
		}
		
		const supplier = await prisma.supplier.create({
			data: { name, email, phone, poBox, address, website, taxNumber }
		});
		
		res.status(201).json(supplier);
	} catch (error) {
		console.error('Error creating supplier:', error);
		res.status(500).json({ error: 'Failed to create supplier' });
	}
});

// Update supplier
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, email, phone, poBox, address, website, taxNumber, rating, isActive } = req.body;
		
		if (!name || !email || !phone) {
			return res.status(400).json({ error: 'Name, email, and phone are required' });
		}
		
		const supplier = await prisma.supplier.update({
			where: { id },
			data: { name, email, phone, poBox, address, website, taxNumber, rating, isActive }
		});
		
		res.json(supplier);
	} catch (error) {
		console.error('Error updating supplier:', error);
		res.status(500).json({ error: 'Failed to update supplier' });
	}
});

// Delete supplier (soft delete)
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		await prisma.supplier.update({
			where: { id },
			data: { isActive: false }
		});
		
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting supplier:', error);
		res.status(500).json({ error: 'Failed to delete supplier' });
	}
});

// Get supplier quotes
router.get('/:id/quotes', async (req, res) => {
	try {
		const { id } = req.params;
		const quotes = await prisma.quote.findMany({
			where: { supplierId: id },
			orderBy: { createdAt: 'desc' }
		});
		
		res.json(quotes);
	} catch (error) {
		console.error('Error fetching supplier quotes:', error);
		res.status(500).json({ error: 'Failed to fetch supplier quotes' });
	}
});

export default router;

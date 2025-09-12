import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get all inventory items
router.get('/', async (req: Request, res: Response) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        logs: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get inventory item by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await prisma.inventory.findUnique({
      where: { id },
      include: {
        logs: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Create new inventory item
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, category, location, minStock, maxStock, currentStock, unit, unitPrice } = req.body;
    
    if (!name || !category || !unit) {
      return res.status(400).json({ error: 'Name, category, and unit are required' });
    }
    
    const item = await prisma.inventory.create({
      data: {
        name,
        description,
        category,
        location,
        minStock: minStock || 0,
        maxStock,
        currentStock: currentStock || 0,
        unit,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null
      }
    });
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, location, minStock, maxStock, unit, unitPrice } = req.body;
    
    if (!name || !category || !unit) {
      return res.status(400).json({ error: 'Name, category, and unit are required' });
    }
    
    const item = await prisma.inventory.update({
      where: { id },
      data: {
        name,
        description,
        category,
        location,
        minStock: minStock || 0,
        maxStock,
        unit,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null
      }
    });
    
    res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Delete inventory item
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.inventory.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Update stock (IN/OUT/ADJUSTMENT)
router.post('/:id/stock', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, quantity, remarks } = req.body;
    
    if (!type || !quantity) {
      return res.status(400).json({ error: 'Type and quantity are required' });
    }
    
    if (!['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be IN, OUT, ADJUSTMENT, or TRANSFER' });
    }
    
    const item = await prisma.inventory.findUnique({
      where: { id }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const previousStock = item.currentStock;
    let newStock = previousStock;
    
    switch (type) {
      case 'IN':
        newStock = previousStock + parseInt(quantity);
        break;
      case 'OUT':
        newStock = previousStock - parseInt(quantity);
        if (newStock < 0) {
          return res.status(400).json({ error: 'Insufficient stock' });
        }
        break;
      case 'ADJUSTMENT':
        newStock = parseInt(quantity);
        break;
      case 'TRANSFER':
        newStock = previousStock - parseInt(quantity);
        if (newStock < 0) {
          return res.status(400).json({ error: 'Insufficient stock for transfer' });
        }
        break;
    }
    
    // Update inventory and create log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.inventory.update({
        where: { id },
        data: { currentStock: newStock }
      });
      
      const log = await tx.inventoryLog.create({
        data: {
          type: type as any,
          quantity: parseInt(quantity),
          previousStock,
          newStock,
          remarks,
          inventoryId: id,
          userId: req.user!.id
        }
      });
      
      return { updatedItem, log };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Get inventory logs
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await prisma.inventoryLog.findMany({
      where: { inventoryId: id },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching inventory logs:', error);
    res.status(500).json({ error: 'Failed to fetch inventory logs' });
  }
});

export default router;

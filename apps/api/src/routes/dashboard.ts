import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get dashboard statistics for Chairman
router.get('/chairman', requireAuth, async (req: Request, res: Response) => {
  try {
    const [
      activeProjects,
      totalSuppliers,
      pendingApprovals,
      activeOrders
    ] = await Promise.all([
      prisma.project.count({ where: { status: { in: ['ACTIVE', 'PLANNING'] } } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.sampleApproval.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: { in: ['APPROVED', 'IN_PROGRESS'] } } })
    ]);

    res.json({
      activeProjects,
      totalSuppliers,
      pendingApprovals,
      activeOrders
    });
  } catch (error) {
    console.error('Error fetching chairman dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get dashboard statistics for Finance & Procurement
router.get('/finance-procurement', requireAuth, async (req: Request, res: Response) => {
  try {
    const [
      activeSuppliers,
      procurementPlans,
      pendingQuotes,
      totalBudget
    ] = await Promise.all([
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.procurementPlan.count({ where: { status: { in: ['IN_PROGRESS', 'DRAFT'] } } }),
      prisma.quote.count({ where: { status: 'SUBMITTED' } }),
      prisma.procurementItem.aggregate({
        _sum: { marketPrice: true },
        where: { procurementPlan: { status: { in: ['IN_PROGRESS', 'DRAFT'] } } }
      })
    ]);

    res.json({
      activeSuppliers,
      procurementPlans,
      pendingQuotes,
      totalBudget: totalBudget._sum?.marketPrice || 0
    });
  } catch (error) {
    console.error('Error fetching finance-procurement dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get dashboard statistics for Site Supervisor
router.get('/site-supervisor', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const [
      myProjects,
      inventoryItems,
      lowStockItems,
      outOfStockItems
    ] = await Promise.all([
      prisma.project.count({ 
        where: { 
          createdBy: userId,
          status: { in: ['ACTIVE', 'PLANNING'] }
        } 
      }),
      prisma.inventory.count(),
      prisma.inventory.count({ where: { currentStock: { lte: 10 } } }),
      prisma.inventory.count({ where: { currentStock: 0 } })
    ]);

    res.json({
      myProjects,
      inventoryItems,
      lowStockItems,
      outOfStockItems
    });
  } catch (error) {
    console.error('Error fetching site-supervisor dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;

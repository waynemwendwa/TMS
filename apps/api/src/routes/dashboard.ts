import { Router } from 'express';
import { prisma } from '@tms/db/client';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get dashboard statistics for Chairman
router.get('/chairman', requireAuth, async (req, res) => {
  try {
    const [
      activeProjects,
      totalSuppliers,
      pendingApprovals,
      activeOrders
    ] = await Promise.all([
      prisma.project.count({ where: { status: { in: ['ACTIVE', 'IN_PROGRESS'] } } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.sampleApproval.count({ where: { status: 'PENDING' } }),
      prisma.procurementItem.count({ where: { status: { in: ['ORDERED', 'IN_TRANSIT'] } } })
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
router.get('/finance-procurement', requireAuth, async (req, res) => {
  try {
    const [
      activeSuppliers,
      procurementPlans,
      pendingQuotes,
      totalBudget
    ] = await Promise.all([
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.procurementPlan.count({ where: { status: { in: ['ACTIVE', 'DRAFT'] } } }),
      prisma.quote.count({ where: { status: 'PENDING' } }),
      prisma.procurementItem.aggregate({
        _sum: { estimatedCost: true },
        where: { status: { in: ['PLANNED', 'ORDERED'] } }
      })
    ]);

    res.json({
      activeSuppliers,
      procurementPlans,
      pendingQuotes,
      totalBudget: totalBudget._sum.estimatedCost || 0
    });
  } catch (error) {
    console.error('Error fetching finance-procurement dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get dashboard statistics for Site Supervisor
router.get('/site-supervisor', requireAuth, async (req, res) => {
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
          assignedSupervisorId: userId,
          status: { in: ['ACTIVE', 'IN_PROGRESS'] }
        } 
      }),
      prisma.inventoryItem.count(),
      prisma.inventoryItem.count({ where: { quantity: { lte: 10 } } }),
      prisma.inventoryItem.count({ where: { quantity: 0 } })
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

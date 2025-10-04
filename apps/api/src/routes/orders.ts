import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Get all orders with role-based filtering
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    let where: any = {};

    // Role-based filtering
    if (user.role === 'SITE_SUPERVISOR') {
      // Site supervisors can only see their own orders
      where.requestedById = user.id;
    } else if (user.role === 'PROCUREMENT' || user.role === 'FINANCE_PROCUREMENT') {
      // Procurement can see orders pending their review or that they've processed
      where.OR = [
        { status: 'PENDING_PROCUREMENT' },
        { procurementApprovedBy: user.id },
        { procurementSourcedBy: user.id }
      ];
    } else if (user.role === 'CHAIRMAN' || user.role === 'CHAIRMAN_PA') {
      // Chairman and PA can see orders pending their approval or that they've approved
      where.OR = [
        { status: 'PENDING_CHAIRMAN' },
        { chairmanApprovedBy: user.id }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        project: {
          select: { id: true, title: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        procurementApprover: {
          select: { id: true, name: true, email: true }
        },
        chairmanApprover: {
          select: { id: true, name: true, email: true }
        },
        procurementSourcer: {
          select: { id: true, name: true, email: true }
        },
        items: true,
        _count: {
          select: { deliveries: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, title: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        procurementApprover: {
          select: { id: true, name: true, email: true }
        },
        chairmanApprover: {
          select: { id: true, name: true, email: true }
        },
        procurementSourcer: {
          select: { id: true, name: true, email: true }
        },
        items: true,
        deliveries: {
          include: {
            supplier: true,
            documents: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Role-based access control
    if (user.role === 'SITE_SUPERVISOR' && order.requestedById !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order (Site Supervisors only)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (user.role !== 'SITE_SUPERVISOR') {
      return res.status(403).json({ error: 'Only site supervisors can create orders' });
    }

    const { 
      projectId, 
      title, 
      description, 
      requiredDate, 
      totalAmount, 
      remarks, 
      items 
    } = req.body;

    if (!projectId || !title || !items || items.length === 0) {
      return res.status(400).json({ error: 'Project ID, title, and items are required' });
    }

    // Verify the supervisor has access to this project
    const assignment = await prisma.siteSupervisorAssignment.findUnique({
      where: { userId: user.id }
    });

    if (!assignment || assignment.projectId !== projectId) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          title,
          description,
          requiredDate: requiredDate ? new Date(requiredDate) : null,
          totalAmount: totalAmount ? parseFloat(totalAmount) : null,
          remarks,
          projectId,
          requestedById: user.id,
          status: 'PENDING_PROCUREMENT'
        }
      });

      // Create order items
      await tx.orderItem.createMany({
        data: items.map((item: any) => ({
          orderId: newOrder.id,
          itemCode: item.itemCode || '',
          description: item.description || '',
          unit: item.unit || 'units',
          quantity: parseInt(item.quantity) || 0,
          unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : null,
          totalPrice: item.totalPrice ? parseFloat(item.totalPrice) : null,
          remarks: item.remarks || null
        }))
      });

      return newOrder;
    });

    // Fetch the complete order with relations
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        project: {
          select: { id: true, title: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        items: true
      }
    });

    res.status(201).json(completeOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Procurement approval (PROCUREMENT and FINANCE_PROCUREMENT roles)
router.put('/:id/approve-procurement', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'PROCUREMENT' && user.role !== 'FINANCE_PROCUREMENT') {
      return res.status(403).json({ error: 'Only procurement staff can approve orders' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'PENDING_PROCUREMENT') {
      return res.status(400).json({ error: 'Order is not pending procurement approval' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'PENDING_CHAIRMAN',
        procurementApprovedAt: new Date(),
        procurementApprovedBy: user.id
      },
      include: {
        project: {
          select: { id: true, title: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        procurementApprover: {
          select: { id: true, name: true, email: true }
        },
        items: true
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error approving order for procurement:', error);
    res.status(500).json({ error: 'Failed to approve order' });
  }
});

// Chairman approval (CHAIRMAN and CHAIRMAN_PA roles)
router.put('/:id/approve-chairman', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { approved } = req.body; // true for approve, false for reject

    if (user.role !== 'CHAIRMAN' && user.role !== 'CHAIRMAN_PA') {
      return res.status(403).json({ error: 'Only chairman and PA can approve orders' });
    }

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'PENDING_CHAIRMAN') {
      return res.status(400).json({ error: 'Order is not pending chairman approval' });
    }

    const newStatus = approved ? 'APPROVED' : 'REJECTED';
    const updateData: any = {
      status: newStatus,
      chairmanApprovedAt: new Date(),
      chairmanApprovedBy: user.id
    };

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, title: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        procurementApprover: {
          select: { id: true, name: true, email: true }
        },
        chairmanApprover: {
          select: { id: true, name: true, email: true }
        },
        items: true
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error approving/rejecting order by chairman:', error);
    res.status(500).json({ error: 'Failed to process order approval' });
  }
});

// Procurement sourcing (PROCUREMENT and FINANCE_PROCUREMENT roles)
router.put('/:id/source', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'PROCUREMENT' && user.role !== 'FINANCE_PROCUREMENT') {
      return res.status(403).json({ error: 'Only procurement staff can source materials' });
    }

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Order must be approved by chairman before sourcing' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'SOURCING',
        procurementSourcedAt: new Date(),
        procurementSourcedBy: user.id
      },
      include: {
        project: {
          select: { id: true, title: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        procurementApprover: {
          select: { id: true, name: true, email: true }
        },
        chairmanApprover: {
          select: { id: true, name: true, email: true }
        },
        procurementSourcer: {
          select: { id: true, name: true, email: true }
        },
        items: true
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error sourcing order:', error);
    res.status(500).json({ error: 'Failed to source order' });
  }
});

// Mark order as sourced (PROCUREMENT and FINANCE_PROCUREMENT roles)
router.put('/:id/sourced', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'PROCUREMENT' && user.role !== 'FINANCE_PROCUREMENT') {
      return res.status(403).json({ error: 'Only procurement staff can mark orders as sourced' });
    }

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'SOURCING') {
      return res.status(400).json({ error: 'Order must be in sourcing status' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'SOURCED'
      },
      include: {
        project: {
          select: { id: true, title: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        procurementApprover: {
          select: { id: true, name: true, email: true }
        },
        chairmanApprover: {
          select: { id: true, name: true, email: true }
        },
        procurementSourcer: {
          select: { id: true, name: true, email: true }
        },
        items: true
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error marking order as sourced:', error);
    res.status(500).json({ error: 'Failed to mark order as sourced' });
  }
});

// Update order status (for general status updates)
router.put('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user!;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Role-based status update permissions
    let canUpdate = false;
    
    if (user.role === 'SITE_SUPERVISOR' && order.requestedById === user.id) {
      // Supervisors can only update their own orders to certain statuses
      canUpdate = ['CANCELLED'].includes(status);
    } else if (user.role === 'PROCUREMENT' || user.role === 'FINANCE_PROCUREMENT') {
      // Procurement can update to sourcing-related statuses
      canUpdate = ['SOURCING', 'SOURCED', 'IN_PROGRESS', 'COMPLETED'].includes(status);
    } else if (user.role === 'CHAIRMAN' || user.role === 'CHAIRMAN_PA') {
      // Chairman can update to any status
      canUpdate = true;
    }

    if (!canUpdate) {
      return res.status(403).json({ error: 'Insufficient permissions to update order status' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Delete order (only by creator or chairman)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only the creator or chairman can delete orders
    const canDelete = order.requestedById === user.id || 
                     user.role === 'CHAIRMAN' || 
                     user.role === 'CHAIRMAN_PA';

    if (!canDelete) {
      return res.status(403).json({ error: 'Insufficient permissions to delete order' });
    }

    // Only allow deletion of pending orders
    if (!['PENDING_PROCUREMENT', 'PENDING_CHAIRMAN'].includes(order.status)) {
      return res.status(400).json({ error: 'Only pending orders can be deleted' });
    }

    await prisma.order.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;

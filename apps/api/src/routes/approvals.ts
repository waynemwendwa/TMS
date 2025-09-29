import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get all approval requests (for chairman and procurement)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if approval tables exist
    try {
      await prisma.approvalRequest.findFirst();
    } catch (error) {
      console.error('Approval tables not found:', error);
      return res.status(503).json({ 
        error: 'Approval system is not available. Database migration required.',
        details: 'The approval workflow tables have not been created yet. Please contact the administrator.'
      });
    }
    
    const { status, priority, projectId } = req.query;

    let whereClause: any = {};

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Filter by priority if provided
    if (priority) {
      whereClause.priority = priority;
    }

    // Filter by project if provided
    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Chairman can see all requests, procurement can see their own requests
    if (user!.role !== 'CHAIRMAN') {
      whereClause.requestedBy = user!.id;
    }

    const approvalRequests = await prisma.approvalRequest.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        orderTemplate: {
          select: {
            id: true,
            title: true,
            items: {
              select: {
                item: true,
                quantity: true,
                unit: true,
                rate: true,
                amount: true
              }
            }
          }
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        reviewedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        notifications: {
          where: {
            userId: user!.id,
            isRead: false
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(approvalRequests);
  } catch (error) {
    console.error('Error fetching approval requests:', error);
    res.status(500).json({ error: 'Failed to fetch approval requests' });
  }
});

// Get approval request by ID
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        orderTemplate: {
          select: {
            id: true,
            title: true,
            items: {
              select: {
                item: true,
                description: true,
                quantity: true,
                unit: true,
                rate: true,
                amount: true
              }
            }
          }
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        reviewedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!approvalRequest) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    // Check if user has permission to view this request
    if (user!.role !== 'CHAIRMAN' && approvalRequest.requestedBy !== user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(approvalRequest);
  } catch (error) {
    console.error('Error fetching approval request:', error);
    res.status(500).json({ error: 'Failed to fetch approval request' });
  }
});

// Create approval request (for procurement)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if approval tables exist
    try {
      await prisma.approvalRequest.findFirst();
    } catch (error) {
      console.error('Approval tables not found:', error);
      return res.status(503).json({ 
        error: 'Approval system is not available. Database migration required.',
        details: 'The approval workflow tables have not been created yet. Please contact the administrator.'
      });
    }
    
    const { orderTemplateId, projectId, title, description, priority = 'MEDIUM' } = req.body;

    // Only procurement and finance_procurement can create approval requests
    if (!['PROCUREMENT', 'FINANCE_PROCUREMENT'].includes(user.role)) {
      return res.status(403).json({ error: 'Only procurement staff can create approval requests' });
    }

    // Calculate total amount if orderTemplateId is provided
    let totalAmount = null;
    if (orderTemplateId) {
      const orderTemplate = await prisma.orderTemplate.findUnique({
        where: { id: orderTemplateId },
        include: {
          items: true
        }
      });

      if (orderTemplate) {
        totalAmount = orderTemplate!.items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
      }
    }

    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        orderTemplateId: orderTemplateId || null,
        projectId,
        title,
        description,
        totalAmount,
        priority,
        requestedBy: user!.id,
        status: 'PENDING'
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        orderTemplate: {
          select: {
            id: true,
            title: true,
            items: {
              select: {
                item: true,
                quantity: true,
                unit: true,
                rate: true,
                amount: true
              }
            }
          }
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Create notification for chairman
    const chairman = await prisma.user.findFirst({ where: { role: 'CHAIRMAN' } });
    if (chairman) {
      await prisma.approvalNotification.create({
        data: {
          approvalRequestId: approvalRequest.id,
          userId: chairman!.id,
          type: 'APPROVAL_REQUEST',
          title: 'New Approval Request',
          message: `New approval request "${title}" from ${user!.email} requires your review.`
        }
      });
    }

    res.status(201).json(approvalRequest);
  } catch (error) {
    console.error('Error creating approval request:', error);
    res.status(500).json({ error: 'Failed to create approval request' });
  }
});

// Update approval request status (for chairman)
router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Only chairman can approve/reject requests
    if (user.role !== 'CHAIRMAN') {
      return res.status(403).json({ error: 'Only chairman can approve/reject requests' });
    }

    if (!['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const approvalRequest = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: user!.id,
        reviewedAt: new Date(),
        comments
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        orderTemplate: {
          select: {
            id: true,
            title: true,
            items: {
              select: {
                item: true,
                quantity: true,
                unit: true,
                rate: true,
                amount: true
              }
            }
          }
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        reviewedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create notification for the requester
    await prisma.approvalNotification.create({
      data: {
        approvalRequestId: approvalRequest.id,
        userId: approvalRequest.requestedBy,
        type: status === 'APPROVED' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
        title: `Approval Request ${status}`,
        message: `Your approval request "${approvalRequest.title}" has been ${status.toLowerCase()}.${comments ? ` Comments: ${comments}` : ''}`
      }
    });

    res.json(approvalRequest);
  } catch (error) {
    console.error('Error updating approval request status:', error);
    res.status(500).json({ error: 'Failed to update approval request status' });
  }
});

// Get notifications for current user
router.get('/notifications/unread', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notifications = await prisma.approvalNotification.findMany({
      where: {
        userId: user!.id,
        isRead: false
      },
      include: {
        approvalRequest: {
          select: {
            id: true,
            title: true,
            status: true,
            project: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notification = await prisma.approvalNotification.update({
      where: {
        id,
        userId: user!.id
      },
      data: {
        isRead: true
      }
    });

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/notifications/read-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await prisma.approvalNotification.updateMany({
      where: {
        userId: user!.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export default router;

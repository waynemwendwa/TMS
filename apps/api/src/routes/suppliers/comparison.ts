import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';

const router = Router();

// Get supplier comparison for a specific project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { category, sortBy = 'rating', order = 'desc' } = req.query;

    // Get all suppliers for the project
    const projectSuppliers = await prisma.projectSupplier.findMany({
      where: { projectId },
      include: {
        supplier: {
          include: {
            quotes: {
              include: {
                items: true
              }
            },
            marketSurveyItems: true,
            procurementItems: true,
          }
        }
      }
    });

    // Get procurement items for comparison
    const procurementItems = await prisma.procurementItem.findMany({
      where: { 
        procurementPlan: { projectId },
        ...(category && { specification: { contains: category as string } })
      },
      include: {
        supplier: true,
        procurementPlan: true
      }
    });

    // Build comparison data
    const comparison = projectSuppliers.map(ps => {
      const supplier = ps.supplier;
      
      // Calculate average rating from quotes and market survey items
      const quotes = supplier.quotes || [];
      const marketItems = supplier.marketSurveyItems || [];
      const procurementItems = supplier.procurementItems || [];
      
      // Calculate metrics
      const totalQuotes = quotes.length;
      const totalMarketItems = marketItems.length;
      const totalProcurementItems = procurementItems.length;
      
      // Calculate average quote amount
      const avgQuoteAmount = quotes.length > 0 
        ? quotes.reduce((sum: number, quote: any) => sum + Number(quote.totalAmount), 0) / quotes.length
        : 0;
      
      // Calculate average market price
      const avgMarketPrice = marketItems.length > 0
        ? marketItems.reduce((sum: number, item: any) => sum + Number(item.marketPrice), 0) / marketItems.length
        : 0;
      
      // Calculate price competitiveness (lower is better)
      const priceCompetitiveness = avgMarketPrice > 0 
        ? ((avgMarketPrice - avgQuoteAmount) / avgMarketPrice) * 100
        : 0;
      
      // Calculate response rate (based on quotes vs procurement items)
      const responseRate = totalProcurementItems > 0 
        ? (totalQuotes / totalProcurementItems) * 100
        : 0;
      
      // Calculate overall score
      const overallScore = (
        (supplier.rating || 3) * 20 + // Rating weight: 20%
        Math.min(priceCompetitiveness, 50) * 0.4 + // Price competitiveness: 40%
        Math.min(responseRate, 100) * 0.4 // Response rate: 40%
      );

      return {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        rating: supplier.rating || 3,
        isRecommended: ps.isRecommended,
        remarks: ps.remarks,
        metrics: {
          totalQuotes,
          totalMarketItems,
          totalProcurementItems,
          avgQuoteAmount,
          avgMarketPrice,
          priceCompetitiveness,
          responseRate,
          overallScore
        },
        quotes: quotes.map(quote => ({
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          totalAmount: quote.totalAmount,
          status: quote.status,
          validUntil: quote.validUntil,
          submittedAt: quote.submittedAt
        })),
        lastActivity: supplier.updatedAt
      };
    });

    // Sort suppliers based on sortBy parameter
    const sortedComparison = comparison.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'price':
          aValue = a.metrics.priceCompetitiveness;
          bValue = b.metrics.priceCompetitiveness;
          break;
        case 'response':
          aValue = a.metrics.responseRate;
          bValue = b.metrics.responseRate;
          break;
        case 'score':
          aValue = a.metrics.overallScore;
          bValue = b.metrics.overallScore;
          break;
        default:
          aValue = a.metrics.overallScore;
          bValue = b.metrics.overallScore;
      }
      
      return order === 'desc' ? bValue - aValue : aValue - bValue;
    });

    res.json({
      projectId,
      totalSuppliers: sortedComparison.length,
      comparison: sortedComparison,
      summary: {
        avgRating: comparison.reduce((sum: number, s: any) => sum + s.rating, 0) / comparison.length,
        avgPriceCompetitiveness: comparison.reduce((sum: number, s: any) => sum + s.metrics.priceCompetitiveness, 0) / comparison.length,
        avgResponseRate: comparison.reduce((sum: number, s: any) => sum + s.metrics.responseRate, 0) / comparison.length,
        recommendedCount: comparison.filter((s: any) => s.isRecommended).length
      }
    });
  } catch (error) {
    console.error('Error fetching supplier comparison:', error);
    res.status(500).json({ error: 'Failed to fetch supplier comparison' });
  }
});

// Get detailed supplier comparison for specific items
router.get('/items/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { itemCode, category } = req.query;

    // Get procurement items for comparison
    const procurementItems = await prisma.procurementItem.findMany({
      where: { 
        procurementPlan: { projectId },
        ...(itemCode && { itemCode: { contains: itemCode as string } }),
        ...(category && { specification: { contains: category as string } })
      },
      include: {
        supplier: true,
        procurementPlan: true
      }
    });

    // Group by item code for comparison
    const itemComparison = procurementItems.reduce((acc: any, item: any) => {
      const key = item.itemCode;
      if (!acc[key]) {
        acc[key] = {
          itemCode: item.itemCode,
          description: item.description,
          specification: item.specification,
          unit: item.unit,
          quantity: item.quantity,
          marketPrice: item.marketPrice,
          suppliers: []
        };
      }
      
      acc[key].suppliers.push({
        supplierId: item.supplierId,
        supplierName: item.supplier?.name,
        supplierRating: item.supplier?.rating,
        tenderedPrice: item.tenderedPrice,
        priceDifference: item.tenderedPrice ? Number(item.tenderedPrice) - Number(item.marketPrice) : 0,
        priceDifferencePercent: item.tenderedPrice && item.marketPrice 
          ? ((Number(item.tenderedPrice) - Number(item.marketPrice)) / Number(item.marketPrice)) * 100
          : 0,
        remarks: item.remarks
      });
      
      return acc;
    }, {} as any);

    // Sort suppliers by price for each item
    Object.keys(itemComparison).forEach(itemCode => {
      itemComparison[itemCode].suppliers.sort((a: any, b: any) => {
        if (!a.tenderedPrice) return 1;
        if (!b.tenderedPrice) return -1;
        return a.tenderedPrice - b.tenderedPrice;
      });
    });

    res.json({
      projectId,
      itemComparison: Object.values(itemComparison),
      totalItems: Object.keys(itemComparison).length
    });
  } catch (error) {
    console.error('Error fetching item comparison:', error);
    res.status(500).json({ error: 'Failed to fetch item comparison' });
  }
});

// Update supplier recommendation status
router.put('/recommend/:projectId/:supplierId', async (req: Request, res: Response) => {
  try {
    const { projectId, supplierId } = req.params;
    const { isRecommended, remarks } = req.body;

    const projectSupplier = await prisma.projectSupplier.update({
      where: {
        projectId_supplierId: {
          projectId,
          supplierId
        }
      },
      data: {
        isRecommended,
        remarks
      },
      include: {
        supplier: true
      }
    });

    res.json(projectSupplier);
  } catch (error) {
    console.error('Error updating supplier recommendation:', error);
    res.status(500).json({ error: 'Failed to update supplier recommendation' });
  }
});

// Get supplier performance analytics
router.get('/analytics/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));

    // Get supplier performance data
    const suppliers = await prisma.projectSupplier.findMany({
      where: { projectId },
      include: {
        supplier: {
          include: {
            quotes: {
              where: {
                submittedAt: {
                  gte: startDate
                }
              }
            },
            deliveries: {
              where: {
                createdAt: {
                  gte: startDate
                }
              }
            }
          }
        }
      }
    });

    const analytics = suppliers.map((ps: any) => {
      const supplier = ps.supplier;
      const quotes = supplier.quotes || [];
      const deliveries = supplier.deliveries || [];

      // Calculate performance metrics
      const totalQuotes = quotes.length;
      const totalDeliveries = deliveries.length;
      const onTimeDeliveries = deliveries.filter((d: any) => 
        d.status === 'DELIVERED' && d.deliveryDate <= d.createdAt
      ).length;
      
      const onTimeRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;
      const avgQuoteResponseTime = quotes.length > 0 
        ? quotes.reduce((sum: number, quote: any) => {
            const responseTime = new Date(quote.submittedAt).getTime() - new Date(quote.createdAt).getTime();
            return sum + responseTime;
          }, 0) / quotes.length
        : 0;

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        rating: supplier.rating,
        isRecommended: ps.isRecommended,
        performance: {
          totalQuotes,
          totalDeliveries,
          onTimeDeliveries,
          onTimeRate,
          avgQuoteResponseTime: avgQuoteResponseTime / (1000 * 60 * 60 * 24), // Convert to days
          lastActivity: supplier.updatedAt
        }
      };
    });

    res.json({
      projectId,
      period: `${period} days`,
      analytics,
      summary: {
        totalSuppliers: analytics.length,
        recommendedSuppliers: analytics.filter((a: any) => a.isRecommended).length,
        avgOnTimeRate: analytics.reduce((sum: number, a: any) => sum + a.performance.onTimeRate, 0) / analytics.length,
        avgResponseTime: analytics.reduce((sum: number, a: any) => sum + a.performance.avgQuoteResponseTime, 0) / analytics.length
      }
    });
  } catch (error) {
    console.error('Error fetching supplier analytics:', error);
    res.status(500).json({ error: 'Failed to fetch supplier analytics' });
  }
});

export default router;
















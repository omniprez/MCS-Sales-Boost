import express from 'express';
import { storage } from '../storage-provider';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

interface Deal {
  id: string;
  mrc: number;
  nrc: number;
  contractLength: number;
  stage: string;
  createdAt: string;
}

// Get revenue summary data
router.get('/revenue-summary', authenticateUser, async (req, res) => {
  try {
    console.log('Fetching revenue summary for dashboard...');

    // Get all deals
    const deals = await storage.getDeals();
    console.log(`Found ${deals.length} deals in total`);

    // Calculate actual revenue from closed won deals
    const closedWonDeals = deals.filter(deal => deal.stage === 'closed_won');
    const actualRevenue = closedWonDeals.reduce((sum, deal) => {
      // Calculate TCV for each deal: (MRC * Contract Length) + NRC
      const tcv = (deal.mrc * (deal.contractLength || 12)) + (deal.nrc || 0);
      return sum + tcv;
    }, 0);
    console.log(`Actual revenue from closed won deals: ${actualRevenue}`);

    // Get all targets
    const targets = await storage.getAllTargets();

    // Calculate budgeted revenue (sum of revenue targets)
    const budgetedRevenue = targets
      .filter(target => target.targetType === 'revenue')
      .reduce((sum, target) => sum + target.targetValue, 0) || 1000000; // Default to 1M if no targets

    console.log(`Budgeted revenue: ${budgetedRevenue}`);

    // Calculate variance
    const variance = actualRevenue - budgetedRevenue;

    // Calculate trend percentage
    const trendPercentage = budgetedRevenue > 0
      ? Math.round((variance / budgetedRevenue) * 100 * 10) / 10
      : 0;

    // Generate monthly data for the chart
    const now = new Date();
    const monthlyData = [];

    // Create data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });

      // Calculate revenue for this month
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      // Filter deals closed in this month
      const monthDeals = closedWonDeals.filter(deal => {
        const closedDate = new Date(deal.closedDate || deal.createdAt);
        return closedDate >= monthStart && closedDate <= monthEnd;
      });

      // Calculate revenue for this month
      const monthRevenue = monthDeals.reduce((sum, deal) => {
        const tcv = (deal.mrc * (deal.contractLength || 12)) + (deal.nrc || 0);
        return sum + tcv;
      }, 0);

      monthlyData.push({
        month: monthName,
        revenue: monthRevenue
      });
    }

    console.log('Monthly data for chart:', monthlyData);

    res.json({
      actual: actualRevenue,
      budgeted: budgetedRevenue,
      variance,
      trend: trendPercentage,
      monthlyData
    });
  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    res.status(500).json({ error: 'Failed to fetch revenue summary' });
  }
});

// Get gross profit summary data
router.get('/gp-summary', authenticateUser, async (req, res) => {
  try {
    console.log('Fetching gross profit summary for dashboard...');

    // Get all deals
    const deals = await storage.getDeals();
    console.log(`Found ${deals.length} deals in total`);

    // Calculate actual revenue from closed won deals
    const closedWonDeals = deals.filter(deal => deal.stage === 'closed_won');
    const actualRevenue = closedWonDeals.reduce((sum, deal) => {
      // Calculate TCV for each deal: (MRC * Contract Length) + NRC
      const tcv = (deal.mrc * (deal.contractLength || 12)) + (deal.nrc || 0);
      return sum + tcv;
    }, 0);

    // Calculate GP as 40% of revenue
    const gpPercentage = 0.4; // 40% GP
    const actualGP = actualRevenue * gpPercentage;
    console.log(`Actual GP from closed won deals: ${actualGP}`);

    // Get all targets
    const targets = await storage.getAllTargets();

    // Calculate budgeted revenue (sum of revenue targets)
    const budgetedRevenue = targets
      .filter(target => target.targetType === 'revenue')
      .reduce((sum, target) => sum + target.targetValue, 0) || 1000000; // Default to 1M if no targets

    // Calculate budgeted GP as 40% of budgeted revenue
    const budgetedGP = budgetedRevenue * gpPercentage;
    console.log(`Budgeted GP: ${budgetedGP}`);

    // Calculate variance
    const variance = actualGP - budgetedGP;

    // Calculate trend percentage
    const trendPercentage = budgetedGP > 0
      ? Math.round((variance / budgetedGP) * 100 * 10) / 10
      : 0;

    // Generate monthly data for the chart
    const now = new Date();
    const monthlyData = [];

    // Create data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });

      // Calculate revenue for this month
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      // Filter deals closed in this month
      const monthDeals = closedWonDeals.filter(deal => {
        const closedDate = new Date(deal.closedDate || deal.createdAt);
        return closedDate >= monthStart && closedDate <= monthEnd;
      });

      // Calculate revenue for this month
      const monthRevenue = monthDeals.reduce((sum, deal) => {
        const tcv = (deal.mrc * (deal.contractLength || 12)) + (deal.nrc || 0);
        return sum + tcv;
      }, 0);

      // Calculate GP for this month
      const monthGP = monthRevenue * gpPercentage;

      monthlyData.push({
        month: monthName,
        gp: monthGP
      });
    }

    console.log('Monthly GP data for chart:', monthlyData);

    res.json({
      actual: actualGP,
      budgeted: budgetedGP,
      variance,
      trend: trendPercentage,
      monthlyData
    });
  } catch (error) {
    console.error('Error fetching GP summary:', error);
    res.status(500).json({ error: 'Failed to fetch GP summary' });
  }
});

// Get pipeline summary data
router.get('/pipeline-summary', authenticateUser, async (req, res) => {
  try {
    console.log('Pipeline Summary: Fetching data');

    // Get all deals
    const deals = await storage.getDeals();
    console.log(`Pipeline Summary: Found ${deals.length} deals in total`);

    // Log deal stages for debugging
    const stageCount = {
      prospecting: deals.filter(deal => deal.stage === 'prospecting').length,
      qualification: deals.filter(deal => deal.stage === 'qualification').length,
      proposal: deals.filter(deal => deal.stage === 'proposal').length,
      negotiation: deals.filter(deal => deal.stage === 'negotiation').length,
      closed_won: deals.filter(deal => deal.stage === 'closed_won').length,
      closed_lost: deals.filter(deal => deal.stage === 'closed_lost').length,
      other: deals.filter(deal => !['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].includes(deal.stage)).length
    };
    console.log('Pipeline Summary: Deal stages count:', stageCount);

    // Filter active deals (not closed)
    const activeDeals = deals.filter(deal =>
      !['closed_won', 'closed_lost'].includes(deal.stage)
    );
    console.log(`Pipeline Summary: Found ${activeDeals.length} active deals`);

    // Calculate total pipeline value using TCV
    const totalValue = activeDeals.reduce((sum, deal) => {
      // Calculate TCV for each deal: (MRC * Contract Length) + NRC
      const tcv = (deal.mrc * deal.contractLength) + deal.nrc;
      return sum + tcv;
    }, 0);
    console.log(`Pipeline Summary: Total pipeline value: ${totalValue}`);

    // Calculate deal count
    const dealCount = activeDeals.length;

    // Calculate average deal size using TCV
    const avgDealSize = dealCount > 0 ? totalValue / dealCount : 0;

    // Calculate stage distribution
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation'];
    const stageDistribution = stages.map(stage => {
      const stageDeals = activeDeals.filter(deal => deal.stage === stage);
      const stageValue = stageDeals.reduce((sum, deal) => {
        // Calculate TCV for each deal in the stage
        const tcv = (deal.mrc * deal.contractLength) + deal.nrc;
        return sum + tcv;
      }, 0);
      console.log(`Pipeline Summary: Stage ${stage}: ${stageDeals.length} deals, value: ${stageValue}`);
      return {
        stage,
        count: stageDeals.length,
        value: stageValue
      };
    });

    // Calculate trend based on previous period data
    // For now, we'll set it to 0 until we implement historical comparison
    const trendPercentage = 0;

    const response = {
      totalValue,
      dealCount,
      avgDealSize,
      stageDistribution,
      trend: trendPercentage
    };

    console.log('Pipeline Summary: Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching pipeline summary:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline summary' });
  }
});

// Get sales leader data
router.get('/sales-leader', authenticateUser, async (req, res) => {
  try {
    // Get all deals
    const deals = await storage.getDeals();

    // Get all users
    const users = await storage.getUsers();

    // Calculate GP for each user
    const userGP = users.map(user => {
      const userDeals = deals.filter(deal =>
        deal.userId === user.id &&
        deal.stage === 'closed_won'
      );

      const totalValue = userDeals.reduce((sum, deal) => sum + deal.value, 0);
      const gpValue = totalValue * 0.4; // GP is 40% of revenue

      return {
        user,
        gpValue
      };
    });

    // Sort by GP (highest first)
    userGP.sort((a, b) => b.gpValue - a.gpValue);

    // Get top two performers
    const leader = userGP.length > 0 ? userGP[0] : null;
    const secondPlace = userGP.length > 1 ? userGP[1] : null;

    // Calculate percentage ahead
    let percentAhead = 0;
    if (leader && secondPlace && secondPlace.gpValue > 0) {
      percentAhead = Math.round(((leader.gpValue - secondPlace.gpValue) / secondPlace.gpValue) * 100);
    }

    res.json({
      leader: leader ? {
        id: leader.user.id,
        name: leader.user.name,
        role: leader.user.role,
        gpValue: leader.gpValue
      } : null,
      percentAhead
    });
  } catch (error) {
    console.error('Error fetching sales leader:', error);
    res.status(500).json({ error: 'Failed to fetch sales leader' });
  }
});

// Get conversion rate data
router.get('/conversion-rate', authenticateUser, async (req, res) => {
  try {
    // Get all deals
    const deals = await storage.getDeals();

    // Calculate total deals
    const totalDeals = deals.length;

    // Calculate closed won deals
    const closedWonDeals = deals.filter(deal => deal.stage === 'closed_won').length;

    // Calculate conversion rate
    const conversionRate = totalDeals > 0
      ? Math.round((closedWonDeals / totalDeals) * 100 * 10) / 10
      : 0;

    // Calculate stage counts for funnel visualization
    const stageCounts = {
      prospecting: deals.filter(deal => deal.stage === 'prospecting').length,
      qualification: deals.filter(deal => deal.stage === 'qualification').length,
      proposal: deals.filter(deal => deal.stage === 'proposal').length,
      negotiation: deals.filter(deal => deal.stage === 'negotiation').length,
      closed_won: closedWonDeals
    };

    // Calculate trend based on previous period data
    // For now, we'll set it to 0 until we implement historical comparison
    const trendPercentage = 0;

    res.json({
      conversionRate,
      stageCounts,
      trend: trendPercentage
    });
  } catch (error) {
    console.error('Error fetching conversion rate:', error);
    res.status(500).json({ error: 'Failed to fetch conversion rate' });
  }
});

// Get quota completion data
router.get('/quota-completion', authenticateUser, async (req, res) => {
  try {
    console.log('Quota Completion: Fetching data');

    // Get all deals
    const deals = await storage.getDeals();
    console.log(`Quota Completion: Found ${deals.length} deals in total`);

    // Log deal stages for debugging
    const stageCount = {
      prospecting: deals.filter(deal => deal.stage === 'prospecting').length,
      qualification: deals.filter(deal => deal.stage === 'qualification').length,
      proposal: deals.filter(deal => deal.stage === 'proposal').length,
      negotiation: deals.filter(deal => deal.stage === 'negotiation').length,
      closed_won: deals.filter(deal => deal.stage === 'closed_won').length,
      closed_lost: deals.filter(deal => deal.stage === 'closed_lost').length
    };
    console.log('Quota Completion: Deal stages count:', stageCount);

    // Get all targets
    const targets = await storage.getAllTargets();
    console.log(`Quota Completion: Found ${targets.length} targets`);

    // Calculate actual revenue (sum of closed won deals)
    const closedWonDeals = deals.filter(deal => deal.stage === 'closed_won');
    const actualRevenue = closedWonDeals.reduce((sum, deal) => sum + deal.value, 0);
    console.log(`Quota Completion: Closed won deals: ${closedWonDeals.length}, Actual revenue: ${actualRevenue}`);

    // Calculate target revenue (sum of revenue targets)
    const revenueTargets = targets.filter(target => target.targetType === 'revenue');
    const targetRevenue = revenueTargets.reduce((sum, target) => sum + target.targetValue, 0);
    console.log(`Quota Completion: Revenue targets: ${revenueTargets.length}, Target revenue: ${targetRevenue}`);

    // If no targets exist, create a default target for demo purposes
    let finalTargetRevenue = targetRevenue;
    if (finalTargetRevenue === 0) {
      // Set a default target of 1M
      finalTargetRevenue = 1000000;
      console.log(`Quota Completion: No targets found, using default target of ${finalTargetRevenue}`);
    }

    // Calculate completion percentage
    const completionPercentage = finalTargetRevenue > 0
      ? Math.round((actualRevenue / finalTargetRevenue) * 100)
      : 0;
    console.log(`Quota Completion: Completion percentage: ${completionPercentage}%`);

    // Calculate days remaining in period
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const daysRemaining = Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const response = {
      completionPercentage,
      daysRemaining,
      currentValue: actualRevenue,
      targetValue: finalTargetRevenue
    };

    console.log('Quota Completion: Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching quota completion:', error);
    res.status(500).json({ error: 'Failed to fetch quota completion' });
  }
});

// Get win rate data
router.get('/win-rate', authenticateUser, async (req, res) => {
  try {
    // Get all deals
    const deals = await storage.getDeals();

    // Filter closed deals
    const closedDeals = deals.filter(deal =>
      ['closed_won', 'closed_lost'].includes(deal.stage)
    );

    // Calculate won and lost deals
    const wonDeals = closedDeals.filter(deal => deal.stage === 'closed_won').length;
    const lostDeals = closedDeals.filter(deal => deal.stage === 'closed_lost').length;

    // Calculate win rate
    const winRate = closedDeals.length > 0
      ? Math.round((wonDeals / closedDeals.length) * 100)
      : 0;

    // Calculate trend based on previous period data
    // For now, we'll set it to 0 until we implement historical comparison
    const trendPercentage = 0;

    res.json({
      winRate,
      wonDeals,
      lostDeals,
      totalClosed: closedDeals.length,
      trend: trendPercentage
    });
  } catch (error) {
    console.error('Error fetching win rate:', error);
    res.status(500).json({ error: 'Failed to fetch win rate' });
  }
});

// Get average deal size data
router.get('/avg-deal-size', authenticateUser, async (req, res) => {
  try {
    // Get all deals
    const deals = await storage.getDeals();

    // Filter closed won deals
    const closedWonDeals = deals.filter(deal => deal.stage === 'closed_won');

    // Calculate average deal size
    const totalValue = closedWonDeals.reduce((sum, deal) => sum + deal.value, 0);
    const avgDealSize = closedWonDeals.length > 0
      ? totalValue / closedWonDeals.length
      : 0;

    // Calculate deal size distribution
    const dealSizes = closedWonDeals.map(deal => deal.value);

    // Group deals by size ranges
    const ranges = [
      { min: 0, max: 100000 },
      { min: 100000, max: 250000 },
      { min: 250000, max: 500000 },
      { min: 500000, max: 750000 },
      { min: 750000, max: Infinity }
    ];

    const distribution = ranges.map(range => {
      return {
        range: `${range.min / 1000}K - ${range.max === Infinity ? '1M+' : `${range.max / 1000}K`}`,
        count: dealSizes.filter(size => size >= range.min && size < range.max).length
      };
    });

    // Calculate trend based on previous period data
    // For now, we'll set it to 0 until we implement historical comparison
    const trendPercentage = 0;

    res.json({
      avgDealSize,
      distribution,
      trend: trendPercentage
    });
  } catch (error) {
    console.error('Error fetching average deal size:', error);
    res.status(500).json({ error: 'Failed to fetch average deal size' });
  }
});

// Get revenue trend data
router.get('/revenue-trend', authenticateUser, async (req, res) => {
  try {
    // Get all deals
    const deals = await storage.getDeals();

    // Get all targets
    const targets = await storage.getAllTargets();

    // Calculate monthly revenue data
    const monthlyData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = month.toLocaleString('default', { month: 'short' });

      // Calculate actual revenue for the month
      const actualRevenue = deals
        .filter(deal => {
          const dealDate = new Date(deal.createdAt);
          return deal.stage === 'closed_won' &&
                 dealDate >= month &&
                 dealDate <= monthEnd;
        })
        .reduce((sum, deal) => sum + deal.value, 0);

      // Calculate budgeted revenue for the month (simplified)
      const budgetedRevenue = targets
        .filter(target => {
          const startDate = new Date(target.startDate);
          const endDate = new Date(target.endDate);
          return target.targetType === 'revenue' &&
                 startDate <= monthEnd &&
                 endDate >= month;
        })
        .reduce((sum, target) => {
          // Prorate the target value for the month
          const targetMonths = Math.max(1, Math.ceil((new Date(target.endDate).getTime() - new Date(target.startDate).getTime()) / (30 * 24 * 60 * 60 * 1000)));
          return sum + (target.targetValue / targetMonths);
        }, 0);

      monthlyData.push({
        month: monthName,
        actual: actualRevenue,
        budgeted: budgetedRevenue
      });
    }

    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching revenue trend:', error);
    res.status(500).json({ error: 'Failed to fetch revenue trend' });
  }
});

// Get pipeline distribution data
router.get('/pipeline-distribution', authenticateUser, async (req, res) => {
  try {
    // Get all deals
    const deals = await storage.getDeals();

    // Filter active deals (not closed)
    const activeDeals = deals.filter(deal =>
      !['closed_won', 'closed_lost'].includes(deal.stage)
    );

    // Calculate stage distribution
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation'];
    const stageDistribution = stages.map(stage => {
      const stageDeals = activeDeals.filter(deal => deal.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + deal.value, 0)
      };
    });

    res.json(stageDistribution);
  } catch (error) {
    console.error('Error fetching pipeline distribution:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline distribution' });
  }
});

// Get leaderboard data
router.get('/leaderboard', authenticateUser, async (req, res) => {
  try {
    // Get all deals
    const deals = await storage.getDeals();

    // Get all users
    const users = await storage.getUsers();
    console.log(`Found ${users.length} users for leaderboard`);

    // Log user details for debugging
    users.forEach(user => {
      console.log(`User: ${user.id}, ${user.name}, ${user.role}`);
    });

    // Get all targets
    const targets = await storage.getAllTargets();
    console.log(`Found ${targets.length} targets for leaderboard`);

    // Check if there are any sales reps (handle different role formats)
    const salesReps = users.filter(user => {
      const role = user.role.toLowerCase();
      return role === 'sales' || role === 'sales rep' || role === 'sales_rep';
    });
    console.log(`Found ${salesReps.length} sales reps for leaderboard`);

    // Log the sales reps found
    salesReps.forEach(rep => {
      console.log(`Sales rep found: ${rep.id}, ${rep.name}, ${rep.role}`);
    });

    // If no sales reps, create some dummy data
    if (salesReps.length === 0) {
      console.log('No sales reps found, creating dummy data');

      // Create dummy data for the leaderboard
      const dummyData = [
        {
          id: 1,
          name: 'John Doe',
          role: 'sales',
          grossProfit: 1200000,
          quotaCompletion: 85,
          dealsCount: 12,
          pipelineValue: 3000000,
          avgDealSize: 250000,
          rank: 1,
          rankChange: 0
        },
        {
          id: 2,
          name: 'Jane Smith',
          role: 'sales',
          grossProfit: 980000,
          quotaCompletion: 70,
          dealsCount: 10,
          pipelineValue: 2500000,
          avgDealSize: 245000,
          rank: 2,
          rankChange: 0
        },
        {
          id: 3,
          name: 'Bob Johnson',
          role: 'sales',
          grossProfit: 850000,
          quotaCompletion: 60,
          dealsCount: 8,
          pipelineValue: 2000000,
          avgDealSize: 212500,
          rank: 3,
          rankChange: 0
        }
      ];

      return res.json(dummyData);
    }

    // Calculate metrics for each user
    const leaderboardData = salesReps.map(user => {
      console.log(`Calculating metrics for user: ${user.name}`);

      // Get user's deals
      const userDeals = deals.filter(deal => deal.userId === user.id);
      console.log(`User ${user.name} (ID: ${user.id}) has ${userDeals.length} deals`);

      // If user has no deals, log this for debugging
      if (userDeals.length === 0) {
        console.log(`WARNING: User ${user.name} (ID: ${user.id}) has no deals assigned`);
      } else {
        // Log a sample deal for debugging
        console.log(`Sample deal for ${user.name}:`, userDeals[0]);
      }

      // Calculate closed won deals
      const closedWonDeals = userDeals.filter(deal => deal.stage === 'closed_won');
      console.log(`User ${user.name} has ${closedWonDeals.length} closed won deals`);

      // Calculate revenue and GP
      const revenue = closedWonDeals.reduce((sum, deal) => sum + deal.value, 0);
      const grossProfit = revenue * 0.4; // GP is 40% of revenue
      console.log(`User ${user.name} revenue: ${revenue}, GP: ${grossProfit}`);

      // Calculate pipeline value
      const pipelineValue = userDeals
        .filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage))
        .reduce((sum, deal) => sum + deal.value, 0);
      console.log(`User ${user.name} pipeline value: ${pipelineValue}`);

      // Calculate average deal size
      const avgDealSize = closedWonDeals.length > 0
        ? revenue / closedWonDeals.length
        : 0;
      console.log(`User ${user.name} avg deal size: ${avgDealSize}`);

      // Calculate quota completion
      const userTargets = targets.filter(target =>
        target.userId === user.id &&
        target.targetType === 'revenue'
      );
      console.log(`User ${user.name} has ${userTargets.length} targets`);

      const targetValue = userTargets.reduce((sum, target) => sum + target.targetValue, 0);
      const quotaCompletion = targetValue > 0
        ? Math.round((revenue / targetValue) * 100)
        : 0;
      console.log(`User ${user.name} target value: ${targetValue}, quota completion: ${quotaCompletion}%`);

      // Return user data even if they have no deals
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        grossProfit: grossProfit || 0,
        quotaCompletion: quotaCompletion || 0,
        dealsCount: closedWonDeals.length || 0,
        pipelineValue: pipelineValue || 0,
        avgDealSize: avgDealSize || 0
      };
    });

    // Sort by gross profit (highest first)
    leaderboardData.sort((a, b) => b.grossProfit - a.grossProfit);

    // Add rank without rank change for now
    const rankedData = leaderboardData.map((item, index) => {
      return {
        ...item,
        rank: index + 1,
        rankChange: 0 // No change until we implement historical comparison
      };
    });

    // If there's no data after all calculations, return dummy data
    if (rankedData.length === 0) {
      console.log('No ranked data available, returning dummy data');
      const dummyData = [
        {
          id: 1,
          name: 'John Doe',
          role: 'sales',
          grossProfit: 1200000,
          quotaCompletion: 85,
          dealsCount: 12,
          pipelineValue: 3000000,
          avgDealSize: 250000,
          rank: 1,
          rankChange: 0
        },
        {
          id: 2,
          name: 'Jane Smith',
          role: 'sales',
          grossProfit: 980000,
          quotaCompletion: 70,
          dealsCount: 10,
          pipelineValue: 2500000,
          avgDealSize: 245000,
          rank: 2,
          rankChange: 0
        },
        {
          id: 3,
          name: 'Bob Johnson',
          role: 'sales',
          grossProfit: 850000,
          quotaCompletion: 60,
          dealsCount: 8,
          pipelineValue: 2000000,
          avgDealSize: 212500,
          rank: 3,
          rankChange: 0
        }
      ];
      return res.json(dummyData);
    }

    res.json(rankedData);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;

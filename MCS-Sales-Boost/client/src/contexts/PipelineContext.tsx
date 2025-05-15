import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/queryClient';

interface Deal {
  id: number;
  name: string;
  mrc: number;
  nrc: number;
  tcv: number;
  value: number;
  category: string;
  stage: string;
  clientType: string;
  daysInStage: number;
  contractLength: number;
  updatedAt?: string;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
  customer: {
    name: string;
  };
}

interface PipelineContextType {
  deals: Deal[];
  isLoading: boolean;
  error: Error | null;
  totalValue: number;
  averageDealSize: number;
  winRate: number;
  dealsClosingThisMonth: number;
  stageStats: {
    [key: string]: {
      count: number;
      value: number;
    };
  };
  addDeal: (deal: Deal) => void;
  updateDeal: (id: number, updatedDeal: Partial<Deal>) => void;
  removeDeal: (id: number) => void;
  refreshPipeline: () => void;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export const PipelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const calculatePipelineStats = (deals: Deal[]) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Initialize stage stats
    const stageStats: { [key: string]: { count: number; value: number } } = {
      prospecting: { count: 0, value: 0 },
      qualification: { count: 0, value: 0 },
      proposal: { count: 0, value: 0 },
      negotiation: { count: 0, value: 0 },
      closed_won: { count: 0, value: 0 },
      closed_lost: { count: 0, value: 0 }
    };

    // Calculate statistics
    let totalValue = 0;
    let wonDeals = 0;
    let totalDeals = 0;
    let closingThisMonth = 0;

    deals.forEach(deal => {
      const dealValue = Number(deal.tcv) || 0;
      const stage = deal.stage.toLowerCase();

      // Update stage stats
      if (stageStats[stage]) {
        stageStats[stage].count++;
        stageStats[stage].value += dealValue;
      }

      // Update total value (excluding closed_lost)
      if (stage !== 'closed_lost') {
        totalValue += dealValue;
      }

      // Count won deals and total deals for win rate
      if (stage === 'closed_won') {
        wonDeals++;
      }
      if (stage !== 'closed_lost') {
        totalDeals++;
      }

      // Count deals expected to close this month
      const dealDate = deal.updatedAt ? new Date(deal.updatedAt) : null;
      if (dealDate &&
          dealDate.getMonth() === thisMonth &&
          dealDate.getFullYear() === thisYear &&
          stage === 'negotiation') {
        closingThisMonth++;
      }
    });

    return {
      totalValue,
      averageDealSize: totalDeals > 0 ? totalValue / totalDeals : 0,
      winRate: totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0,
      dealsClosingThisMonth: closingThisMonth,
      stageStats
    };
  };

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/pipeline');
      setDeals(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pipeline data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const stats = calculatePipelineStats(deals);

  const addDeal = (deal: Deal) => {
    setDeals(prevDeals => [...prevDeals, deal]);
  };

  const updateDeal = (id: number, updatedDeal: Partial<Deal>) => {
    console.log(`PipelineContext: Updating deal ${id} with data:`, updatedDeal);
    console.log(`PipelineContext: Deal name being updated to:`, updatedDeal.name);

    setDeals(prevDeals => {
      const newDeals = prevDeals.map(deal => {
        if (deal.id === id) {
          const updatedDealObj = { ...deal, ...updatedDeal };
          console.log(`PipelineContext: Deal ${id} updated from:`, deal);
          console.log(`PipelineContext: Deal ${id} updated to:`, updatedDealObj);
          return updatedDealObj;
        }
        return deal;
      });

      return newDeals;
    });
  };

  const removeDeal = (id: number) => {
    setDeals(prevDeals => prevDeals.filter(deal => deal.id !== id));
  };

  return (
    <PipelineContext.Provider value={{
      deals,
      isLoading,
      error,
      totalValue: stats.totalValue,
      averageDealSize: stats.averageDealSize,
      winRate: stats.winRate,
      dealsClosingThisMonth: stats.dealsClosingThisMonth,
      stageStats: stats.stageStats,
      addDeal,
      updateDeal,
      removeDeal,
      refreshPipeline: fetchPipeline
    }}>
      {children}
    </PipelineContext.Provider>
  );
};
export const usePipeline = () => {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
};


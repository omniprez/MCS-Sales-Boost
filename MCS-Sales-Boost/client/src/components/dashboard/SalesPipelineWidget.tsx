import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useLocation } from "wouter";
import { formatCurrency } from "../../lib/utils";

interface DashboardData {
  dealsByStage: {
    prospecting: number;
    qualification: number;
    proposal: number;
    negotiation: number;
    closed_won: number;
  };
  revenueByStage: {
    prospecting: number;
    qualification: number;
    proposal: number;
    negotiation: number;
    closed_won: number;
  };
}

interface DealData {
  id: string | number;
  name: string;
  company: string;
  value: number;
  stage: string;
  salesRep: string;
  avatar?: string;
  closingDate: string;
  probability: number;
}

// Define stage colors
const stageColors: Record<string, string> = {
  'Prospecting': 'bg-blue-300',
  'Qualification': 'bg-blue-400',
  'Proposal': 'bg-blue-500',
  'Negotiation': 'bg-blue-600',
  'Closed Won': 'bg-green-500',
  'Closed Lost': 'bg-red-500',
  'default': 'bg-gray-300'
};

const SalesPipelineWidget = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'my'>('all');
  const [location, setLocation] = useLocation();

  const { data: pipeline = [], isLoading } = useQuery<DealData[]>({
    queryKey: ['pipeline'],
    queryFn: async () => {
      const response = await fetch('/api/pipeline', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline data');
      }
      return response.json();
    },
    staleTime: 10000 // 10 seconds
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    },
    staleTime: 10000 // 10 seconds
  });

  // Calculate total pipeline value
  const totalPipelineValue = pipeline && Array.isArray(pipeline)
    ? pipeline.reduce((sum, deal) => sum + (deal?.value || 0), 0)
    : 0;

  // Group deals by stage and calculate totals
  const dealsByStage = useMemo(() => {
    if (!pipeline || !Array.isArray(pipeline)) return {};

    return pipeline.reduce((acc, deal) => {
      const stage = deal?.stage || 'Unknown';
      if (!acc[stage]) {
        acc[stage] = {
          count: 0,
          value: 0,
          deals: []
        };
      }
      acc[stage].count += 1;
      acc[stage].value += (deal?.value || 0);
      acc[stage].deals.push(deal);
      return acc;
    }, {} as Record<string, { count: number; value: number; deals: DealData[] }>);
  }, [pipeline]);

  // Calculate percentage for each stage
  const stagePercentages = useMemo(() => {
    if (!dealsByStage || totalPipelineValue === 0) return {};

    return Object.entries(dealsByStage).reduce((acc, [stage, data]) => {
      acc[stage] = (data.value / totalPipelineValue) * 100;
      return acc;
    }, {} as Record<string, number>);
  }, [dealsByStage, totalPipelineValue]);

  // Process data for pipeline stages
  const stageData = useMemo(() => {
    // Use the actual pipeline data instead of dashboard data
    if (!dealsByStage) return null;

    console.log('SalesPipelineWidget: Using real pipeline data:', dealsByStage);

    return {
      prospecting: {
        count: dealsByStage['prospecting']?.count || 0,
        value: formatCurrency(dealsByStage['prospecting']?.value || 0)
      },
      qualification: {
        count: dealsByStage['qualification']?.count || 0,
        value: formatCurrency(dealsByStage['qualification']?.value || 0)
      },
      proposal: {
        count: dealsByStage['proposal']?.count || 0,
        value: formatCurrency(dealsByStage['proposal']?.value || 0)
      },
      negotiation: {
        count: dealsByStage['negotiation']?.count || 0,
        value: formatCurrency(dealsByStage['negotiation']?.value || 0)
      },
      closed_won: {
        count: dealsByStage['closed_won']?.count || 0,
        value: formatCurrency(dealsByStage['closed_won']?.value || 0)
      }
    };
  }, [dealsByStage]);

  // Using the centralized formatCurrency utility

  const handleViewAllDeals = () => {
    setLocation('/pipeline');
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button className="flex items-center text-xs font-medium text-[#6B778C] hover:text-[#172B4D]">
            <span>All Deals</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
        {isLoading ? (
          <>
            <Skeleton className="w-full h-28 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="w-full h-24" />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <h3 className="text-sm font-medium">Pipeline Overview</h3>
                <p className="text-sm font-bold">{formatCurrency(totalPipelineValue)}</p>
              </div>

              <div className="h-8 bg-gray-100 rounded-full overflow-hidden flex mb-4">
                {Object.entries(stagePercentages).map(([stage, percentage], index) => {
                  const color = stageColors[stage] || stageColors.default;
                  return (
                    <div
                      key={stage}
                      className={`h-full ${color}`}
                      style={{ width: `${percentage}%` }}
                      title={`${stage}: ${percentage.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
                {Object.entries(dealsByStage).map(([stage, data]) => (
                  <div key={stage} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${stageColors[stage] || stageColors.default} mr-2`}></div>
                    <span className="text-xs">{stage}</span>
                    <span className="text-xs font-medium ml-1">({data.count})</span>
                  </div>
                ))}
              </div>

              {Array.isArray(pipeline) && pipeline.slice(0, 3).map((deal) => (
                <DealCard key={deal?.id} deal={deal} />
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleViewAllDeals}
                className="flex items-center text-sm font-medium text-blue-500 hover:text-blue-700"
              >
                <span>View All Deals</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}
    </div>
  );
};

interface PipelineStageProps {
  count: number;
  value: string;
  label: string;
  highlight?: boolean;
}

const PipelineStage = ({ count, value, label, highlight = false }: PipelineStageProps) => {
  return (
    <div className="text-center">
      <div className={`w-full h-20 ${highlight ? 'bg-[#36B37E] bg-opacity-10' : 'bg-[#FAFBFC]'} rounded-md flex items-center justify-center mb-2`}>
        <span className={`text-xl font-display font-bold ${highlight ? 'text-[#36B37E]' : ''}`}>{count}</span>
      </div>
      <span className="text-xs text-[#6B778C]">{label}</span>
      <p className={`text-xs font-semibold mt-1 ${highlight ? 'text-[#36B37E]' : ''}`}>{value}</p>
    </div>
  );
};

interface DealCardProps {
  deal: any;
}

const DealCard = ({ deal }: DealCardProps) => {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'proposal': return 'text-[#0052CC]';
      case 'negotiation': return 'text-[#FFAB00]';
      case 'qualification': return 'text-[#FF5630]';
      case 'closed_won': return 'text-[#36B37E]';
      default: return 'text-[#6B778C]';
    }
  };

  const getCategoryDot = (category: string) => {
    return category === 'wireless' ? 'bg-blue-500' : 'bg-green-500';
  };

  const formatStage = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ');
  };

  return (
    <motion.div
      className="rounded-lg p-4 mb-3 border border-[#DFE1E6] hover:cursor-pointer hover:bg-[rgba(0,82,204,0.05)]"
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full ${getCategoryDot(deal.category)} mr-2`}></span>
            <h4 className="font-medium text-sm">{deal.name}</h4>
          </div>
          <p className="text-xs text-[#6B778C] mt-1">
            {deal.clientType} • {deal.category === 'wireless' ? 'Wireless Solutions' : 'Fiber Connectivity'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(deal.value)}</p>
          <p className={`text-xs ${getStageColor(deal.stage)} mt-1`}>
            {formatStage(deal.stage)} • {deal.daysInStage} days
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center">
          {deal.user && (
            <>
              {deal.user.avatar ? (
                <img src={deal.user.avatar} alt={deal.user.name} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs">
                  {deal.user.name.charAt(0)}
                </div>
              )}
              <p className="text-xs text-[#6B778C] ml-2">{deal.user.name}</p>
            </>
          )}
        </div>
        <div className="flex">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium mr-2">
            {deal.category === 'wireless' ? 'Wireless' : 'Fiber'}
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
            {deal.clientType}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default SalesPipelineWidget;

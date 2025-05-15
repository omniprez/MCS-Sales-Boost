import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

const PipelineCard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/pipeline-summary'],
    queryFn: async () => {
      console.log('Fetching pipeline summary data');
      const response = await fetch('/api/dashboard/pipeline-summary', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline summary');
      }
      const result = await response.json();
      console.log('Pipeline summary data:', result);
      return result;
    },
    staleTime: 60000 // 1 minute
  });

  if (isLoading) {
    return (
      <Card className="bg-white p-6 metric-card">
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-4 w-40 mb-4" />
        <Skeleton className="h-2 w-full mb-2" />
        <Skeleton className="h-4 w-40" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white p-6 metric-card">
        <div className="text-sm font-medium text-gray-500 mb-2">Pipeline Value</div>
        <div className="text-red-500">Error loading data</div>
      </Card>
    );
  }

  const { totalValue, dealCount, avgDealSize, stageDistribution, trend } = data || {
    totalValue: 0,
    dealCount: 0,
    avgDealSize: 0,
    stageDistribution: [],
    trend: 0
  };

  return (
    <Card className="bg-white p-4 h-full shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-blue-600">Pipeline Value</h3>
        {trend !== 0 && (
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalValue)}</div>
      <div className="text-xs text-gray-500 mb-2">Total across all stages</div>

      {totalValue > 0 ? (
        <div className="flex h-2 w-full rounded-full overflow-hidden mb-2">
          {stageDistribution.map((stage, index) => {
            const colors = ['bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600'];

            return (
              <div
                key={stage.stage}
                className={`h-2 ${colors[index % colors.length]}`}
                style={{
                  width: `${(stage.value / totalValue) * 100}%`,
                  minWidth: '10px'
                }}
              ></div>
            );
          })}
        </div>
      ) : (
        <div className="h-2 w-full bg-gray-200 rounded-full mb-2"></div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Deals: <span className="font-medium">{dealCount}</span></span>
        <span className="text-xs text-gray-500">Avg: <span className="font-medium">{formatCurrency(avgDealSize)}</span></span>
      </div>
    </Card>
  );
};

export default PipelineCard;

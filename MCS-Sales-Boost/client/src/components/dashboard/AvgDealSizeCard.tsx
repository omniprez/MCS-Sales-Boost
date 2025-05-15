import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

const AvgDealSizeCard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/avg-deal-size'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/avg-deal-size', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch average deal size data');
      }
      return response.json();
    },
    staleTime: 60000 // 1 minute
  });

  if (isLoading) {
    return (
      <Card className="bg-white p-6">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white p-6">
        <div className="text-sm font-medium text-gray-500 mb-2">Average Deal Size</div>
        <div className="text-red-500">Error loading data</div>
      </Card>
    );
  }

  const { avgDealSize, distribution, trend } = data || {
    avgDealSize: 0,
    distribution: [],
    trend: 0
  };

  const isPositiveTrend = trend >= 0;

  return (
    <Card className="bg-white p-4 h-full shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-blue-600">Average Deal Size</h3>
        <span className={`text-xs font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
          {isPositiveTrend ? '+' : ''}{trend}%
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(avgDealSize)}</div>

      <div className="flex items-end h-6 mb-1">
        <div className="w-1/5 bg-blue-200 h-2 rounded-l-full"></div>
        <div className="w-1/5 bg-blue-300 h-3 rounded-sm"></div>
        <div className="w-1/5 bg-blue-400 h-4 rounded-sm"></div>
        <div className="w-1/5 bg-blue-500 h-6 rounded-sm"></div>
        <div className="w-1/5 bg-blue-600 h-3 rounded-r-full"></div>
      </div>
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>0</span>
        <span>250K</span>
        <span>500K</span>
        <span>750K</span>
        <span>1M+</span>
      </div>
    </Card>
  );
};

export default AvgDealSizeCard;

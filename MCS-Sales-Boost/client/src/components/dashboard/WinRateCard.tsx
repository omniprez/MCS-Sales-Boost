import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

const WinRateCard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/win-rate'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/win-rate', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch win rate data');
      }
      return response.json();
    },
    staleTime: 60000 // 1 minute
  });

  if (isLoading) {
    return (
      <Card className="bg-white p-6">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-8 w-16 mb-4" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white p-6">
        <div className="text-sm font-medium text-gray-500 mb-2">Win Rate</div>
        <div className="text-red-500">Error loading data</div>
      </Card>
    );
  }

  const { winRate, wonDeals, lostDeals, totalClosed, trend } = data || {
    winRate: 0,
    wonDeals: 0,
    lostDeals: 0,
    totalClosed: 0,
    trend: 0
  };

  const isPositiveTrend = trend >= 0;

  return (
    <Card className="bg-white p-4 h-full shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-blue-600">Win Rate</h3>
        <span className={`text-xs font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
          {isPositiveTrend ? '+' : ''}{trend}%
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{winRate}%</div>

      <div className="flex justify-between items-center">
        <div className="flex flex-col items-center bg-green-50 rounded-md px-3 py-1 flex-1 mr-2 border border-green-100">
          <div className="text-xs text-gray-500">Won</div>
          <div className="text-sm font-medium text-gray-900">{wonDeals}</div>
        </div>
        <div className="flex flex-col items-center bg-red-50 rounded-md px-3 py-1 flex-1 border border-red-100">
          <div className="text-xs text-gray-500">Lost</div>
          <div className="text-sm font-medium text-gray-900">{lostDeals}</div>
        </div>
      </div>
    </Card>
  );
};

export default WinRateCard;

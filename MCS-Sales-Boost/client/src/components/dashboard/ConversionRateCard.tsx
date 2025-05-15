import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

const ConversionRateCard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/conversion-rate'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/conversion-rate', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch conversion rate data');
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
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white p-6">
        <div className="text-sm font-medium text-gray-500 mb-2">Conversion Rate</div>
        <div className="text-red-500">Error loading data</div>
      </Card>
    );
  }

  const { conversionRate, stageCounts, trend } = data || { conversionRate: 0, stageCounts: {}, trend: 0 };
  const isPositiveTrend = trend >= 0;

  return (
    <Card className="bg-white p-4 h-full shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-blue-600">Conversion Rate</h3>
        <span className={`text-xs font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
          {isPositiveTrend ? '+' : ''}{trend}%
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{conversionRate}%</div>

      <div className="flex items-center">
        <div className="w-full">
          <div className="h-2 w-full bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${conversionRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Prospecting</span>
            <span className="text-xs text-gray-700">Closed Won</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ConversionRateCard;

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { formatCurrency } from "../../lib/utils";

const QuotaCompletionCard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/quota-completion'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/quota-completion', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch quota completion data');
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
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-8 w-16 mb-4" />
        <Skeleton className="h-3 w-full mb-4" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white p-6">
        <div className="text-sm font-medium text-gray-500 mb-2">Quota Completion</div>
        <div className="text-red-500">Error loading data</div>
      </Card>
    );
  }

  const { completionPercentage, daysRemaining, currentValue, targetValue } = data || {
    completionPercentage: 0,
    daysRemaining: 0,
    currentValue: 0,
    targetValue: 0
  };

  return (
    <Card className="bg-white p-4 h-full shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-blue-600">Quota Completion</h3>
        <span className="text-xs font-medium text-gray-500">{daysRemaining} days</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{completionPercentage}%</div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
        <div
          className="bg-blue-500 h-2 rounded-full"
          style={{ width: `${Math.min(completionPercentage, 100)}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-500">Current: <span className="font-medium">{formatCurrency(currentValue)}</span></span>
        <span className="text-gray-500">Target: <span className="font-medium">{formatCurrency(targetValue)}</span></span>
      </div>
    </Card>
  );
};

export default QuotaCompletionCard;

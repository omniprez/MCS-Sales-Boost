import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

const RevenueCard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/revenue-summary'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/revenue-summary', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch revenue summary');
      }
      return response.json();
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
        <div className="text-sm font-medium text-gray-500 mb-2">Revenue</div>
        <div className="text-red-500">Error loading data</div>
      </Card>
    );
  }

  const { actual, budgeted, variance, trend } = data || { actual: 0, budgeted: 0, variance: 0, trend: 0 };
  const isPositiveTrend = trend >= 0;

  return (
    <Card className="bg-white p-4 h-full shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-blue-600">Revenue</h3>
        <span className={`text-xs font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
          {isPositiveTrend ? '+' : ''}{trend}%
        </span>
      </div>
      <div className="flex items-baseline mb-1">
        <span className="text-2xl font-bold text-gray-900">{formatCurrency(actual)}</span>
        <span className="ml-2 text-xs text-gray-500">/ {formatCurrency(budgeted)}</span>
      </div>
      <div className="text-xs text-gray-500 mb-2">Actual / Budgeted</div>

      <div className="h-2 w-full bg-gray-200 rounded-full mb-2">
        <div
          className={`h-2 rounded-full ${isPositiveTrend ? 'bg-blue-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(Math.max((actual / budgeted) * 100, 0), 100)}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Variance: <span className={`font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
            {isPositiveTrend ? '+' : ''}{formatCurrency(variance)}
          </span>
        </span>
        {data?.monthlyData && data.monthlyData.length > 0 ? (
          <svg className="h-6 w-16" viewBox="0 0 100 40" preserveAspectRatio="none">
            {(() => {
              // Generate SVG path from monthly data
              const maxRevenue = Math.max(...data.monthlyData.map(m => m.revenue));
              const points = data.monthlyData.map((month, index) => {
                const x = (index / (data.monthlyData.length - 1)) * 100;
                // Invert Y axis (0 is top in SVG)
                const y = maxRevenue > 0 ? 40 - ((month.revenue / maxRevenue) * 35) : 20;
                return `${x},${y}`;
              });

              return (
                <polyline
                  points={points.join(' ')}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                />
              );
            })()}
          </svg>
        ) : (
          <svg className="h-6 w-16" viewBox="0 0 100 40" preserveAspectRatio="none">
            <line x1="0" y1="20" x2="100" y2="20" stroke="#e5e7eb" strokeWidth="2" />
          </svg>
        )}
      </div>
    </Card>
  );
};

export default RevenueCard;

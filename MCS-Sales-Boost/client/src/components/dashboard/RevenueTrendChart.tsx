import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from "../../lib/utils";

const RevenueTrendChart = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/revenue-trend'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/revenue-trend', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch revenue trend data');
      }
      return response.json();
    },
    staleTime: 60000 // 1 minute
  });

  if (isLoading) {
    return (
      <Card className="bg-white p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white p-6">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading chart data</div>
        </CardContent>
      </Card>
    );
  }

  // Format data for the chart
  const chartData = data || [];

  const formatYAxis = (value: number) => {
    return formatCurrency(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-500">
            Actual: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-gray-500">
            Budget: {formatCurrency(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-blue-600">Revenue Trend</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-500">Actual</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-200 rounded-full mr-1"></div>
            <span className="text-xs text-gray-500">Budgeted</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="actual"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Actual"
              />
              <Area
                type="monotone"
                dataKey="budgeted"
                stackId="2"
                stroke="#93c5fd"
                fill="#93c5fd"
                fillOpacity={0.4}
                name="Budgeted"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-gray-400">No revenue trend data available</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RevenueTrendChart;

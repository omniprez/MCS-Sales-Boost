import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from "../../lib/utils";

const PipelineDistributionChart = () => {
  const [viewMode, setViewMode] = useState<'value' | 'count'>('value');

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/pipeline-distribution'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/pipeline-distribution', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline distribution data');
      }
      return response.json();
    },
    staleTime: 60000 // 1 minute
  });

  if (isLoading) {
    return (
      <Card className="bg-white p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white p-6">
        <CardHeader>
          <CardTitle>Pipeline Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading chart data</div>
        </CardContent>
      </Card>
    );
  }

  // Format data for the chart
  const chartData = data ? data.map((item: any) => ({
    stage: item.stage.charAt(0).toUpperCase() + item.stage.slice(1),
    value: item.value,
    count: item.count
  })) : [];

  const stageColors = [
    '#93c5fd', // blue-300
    '#60a5fa', // blue-400
    '#3b82f6', // blue-500
    '#2563eb', // blue-600
  ];

  const formatYAxis = (value: number) => {
    return viewMode === 'value' ? formatCurrency(value) : value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{label}</p>
          {viewMode === 'value' ? (
            <p className="text-blue-600">
              Value: {formatCurrency(payload[0].value)}
            </p>
          ) : (
            <p className="text-blue-600">
              Count: {payload[0].value} deals
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-blue-600">Pipeline Distribution</h3>
        <div className="flex items-center space-x-2">
          <button
            className={`text-sm ${viewMode === 'value' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setViewMode('value')}
          >
            By Value
          </button>
          <button
            className={`text-sm ${viewMode === 'count' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setViewMode('count')}
          >
            By Count
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={formatYAxis} />
              <YAxis type="category" dataKey="stage" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={viewMode === 'value' ? 'value' : 'count'}
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={stageColors[index % stageColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-gray-400">No pipeline distribution data available</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PipelineDistributionChart;

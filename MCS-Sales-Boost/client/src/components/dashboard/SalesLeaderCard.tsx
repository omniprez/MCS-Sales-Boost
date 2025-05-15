import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Award } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

const SalesLeaderCard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/sales-leader'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/sales-leader', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch sales leader data');
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
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <div className="flex items-center mb-3">
          <Skeleton className="w-10 h-10 rounded-full mr-3" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-32" />
      </Card>
    );
  }

  if (error || !data || !data.leader) {
    return (
      <Card className="bg-white p-6 metric-card">
        <div className="text-sm font-medium text-gray-500 mb-2">Sales Leader</div>
        <div className="text-red-500">No leader data available</div>
      </Card>
    );
  }

  const { leader, percentAhead } = data;
  const initials = leader.name.split(' ').map(n => n[0]).join('');

  return (
    <Card className="bg-white p-4 h-full shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-blue-600">Sales Leader</h3>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
      <div className="flex items-center mb-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full mr-2 bg-yellow-100 text-yellow-800 font-bold text-sm">{initials}</div>
        <div>
          <div className="text-base font-bold text-gray-900">{leader.name}</div>
          <div className="text-xs text-gray-500">{leader.role || 'sales_rep'}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">GP Achieved:</span>
        <span className="text-sm font-bold text-gray-900">{formatCurrency(leader.gpValue)}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Ahead by:</span>
        <span className="text-xs font-medium text-green-600">+{percentAhead}% from 2nd place</span>
      </div>
    </Card>
  );
};

export default SalesLeaderCard;

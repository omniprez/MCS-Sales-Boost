import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { TrendingUp, TrendingDown, Medal, Award, Trophy, HelpCircle } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";

const SalesLeaderboard = () => {
  const [animate, setAnimate] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/leaderboard'],
    queryFn: async () => {
      console.log('Fetching leaderboard data...');
      const response = await fetch('/api/dashboard/leaderboard', {
        credentials: 'include',
        cache: 'no-cache', // Ensure we don't get cached data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      const result = await response.json();
      console.log('Leaderboard data received:', result);
      return result;
    },
    staleTime: 0, // Always refetch
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  if (isLoading) {
    return (
      <Card className="bg-white p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="overflow-x-auto">
          <Skeleton className="h-[250px] w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white p-6">
        <CardHeader>
          <CardTitle>Sales Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading leaderboard data</div>
        </CardContent>
      </Card>
    );
  }

  // Sort data by gross profit (highest first)
  const sortedData = [...(data || [])].sort((a, b) => b.grossProfit - a.grossProfit);

  // Log the data for debugging
  console.log('Leaderboard data:', data);

  // Get rank change icon with color
  const getRankChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500 ml-1" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500 ml-1" />;
    } else {
      return null;
    }
  };

  // Get rank medal for top performers
  const getRankMedal = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="h-5 w-5 text-yellow-500 mr-2" title="Top Performer" />;
    } else if (rank === 2) {
      return <Medal className="h-5 w-5 text-gray-400 mr-2" title="Second Place" />;
    } else if (rank === 3) {
      return <Award className="h-5 w-5 text-amber-700 mr-2" title="Third Place" />;
    }
    return null;
  };

  // Get background color for rows based on rank
  const getRowBackground = (rank: number) => {
    if (rank === 1) return "bg-yellow-50";
    if (rank === 2) return "bg-gray-50";
    if (rank === 3) return "bg-amber-50";
    return rank % 2 === 0 ? "bg-blue-50" : "bg-white";
  };

  // Get color for quota completion
  const getQuotaColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-6">
        <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
        <h3 className="text-xl font-bold text-blue-600">
          Sales Leaderboard
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className={`min-w-full table-fixed ${animate ? 'animate-pulse' : ''}`}>
          <thead>
            <tr className="bg-blue-100 border-b border-blue-200">
              <th className="w-[8%] px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-help">
                        Rank
                        <HelpCircle className="h-3 w-3 ml-1 opacity-70" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Current ranking based on gross profit</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
              <th className="w-[22%] px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-help">
                        Sales Rep
                        <HelpCircle className="h-3 w-3 ml-1 opacity-70" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Sales representative name and initials</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
              <th className="w-[14%] px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                <div className="flex items-center text-blue-600">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center cursor-help">
                          Gross Profit
                          <HelpCircle className="h-3 w-3 ml-1 opacity-70" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Total gross profit (40% of revenue) from closed won deals</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="w-[14%] px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                <div className="flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center cursor-help">
                          % of Quota
                          <HelpCircle className="h-3 w-3 ml-1 opacity-70" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Percentage of revenue target achieved for the current period</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="w-[10%] px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                <div className="flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center cursor-help">
                          Deals Closed
                          <HelpCircle className="h-3 w-3 ml-1 opacity-70" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Number of deals closed and won</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="w-[16%] px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-help">
                        Pipeline
                        <HelpCircle className="h-3 w-3 ml-1 opacity-70" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Total value of deals in the pipeline (not yet closed)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
              <th className="w-[16%] px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-help">
                        Avg Deal Size
                        <HelpCircle className="h-3 w-3 ml-1 opacity-70" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Average value of closed won deals</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData && sortedData.length > 0 ? (
              sortedData.map((entry, index) => {
                // Safely get initials, handling cases where name might be undefined
                const initials = entry.name ? entry.name.split(' ').map((n: string) => n[0]).join('') : 'XX';

                return (
                  <tr
                    key={entry.id}
                    className={`leaderboard-row border-b border-gray-200 hover:bg-opacity-80 transition-colors ${getRowBackground(index + 1)} ${animate ? 'transition-all duration-500' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-start">
                        {getRankMedal(index + 1)}
                        <span className={`text-sm font-bold ${index < 3 ? 'text-blue-700' : 'text-gray-900'}`}>
                          {index + 1}
                        </span>
                        {getRankChangeIcon(entry.rankChange)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        } font-bold`}>
                          {initials}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{entry.name || 'Unknown Sales Rep'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-700">
                      {formatCurrency(entry.grossProfit)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        entry.quotaCompletion >= 100 ? 'text-green-700' :
                        entry.quotaCompletion >= 75 ? 'text-blue-700' :
                        entry.quotaCompletion >= 50 ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {entry.quotaCompletion}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`${getQuotaColor(entry.quotaCompletion)} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(entry.quotaCompletion, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Badge variant="outline" className={`${
                        entry.dealsCount > 10 ? 'border-purple-500 text-purple-700' :
                        entry.dealsCount > 5 ? 'border-blue-500 text-blue-700' :
                        'border-gray-500 text-gray-700'
                      }`}>
                        {entry.dealsCount}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(entry.pipelineValue)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(entry.avgDealSize)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Trophy className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-lg font-medium">No sales reps found</p>
                    <p className="text-sm">Add sales reps to see them in the leaderboard</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with information */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 flex justify-center items-center">
        <p>Showing {sortedData?.length || 0} sales representatives</p>
      </div>
    </Card>
  );
};

export default SalesLeaderboard;

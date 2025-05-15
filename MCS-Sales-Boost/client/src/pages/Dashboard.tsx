import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { DollarSign, Users, TrendingUp, Award, BarChart, Activity, Plus, TrendingDown, Star, BarChart2, PieChart } from "lucide-react";
import { Button } from "../components/ui/button";
import { formatCurrency } from "../lib/utils";
import NewDealDialog from "../components/deals/NewDealDialog";

// Import dashboard components
import RevenueCard from "../components/dashboard/RevenueCard";
import GrossProfitCard from "../components/dashboard/GrossProfitCard";
import PipelineCard from "../components/dashboard/PipelineCard";
import SalesLeaderCard from "../components/dashboard/SalesLeaderCard";
import ConversionRateCard from "../components/dashboard/ConversionRateCard";
import QuotaCompletionCard from "../components/dashboard/QuotaCompletionCard";
import WinRateCard from "../components/dashboard/WinRateCard";
import AvgDealSizeCard from "../components/dashboard/AvgDealSizeCard";
import RevenueTrendChart from "../components/dashboard/RevenueTrendChart";
import PipelineDistributionChart from "../components/dashboard/PipelineDistributionChart";
import SalesLeaderboard from "../components/dashboard/SalesLeaderboard";

export default function Dashboard() {
  // State for new deal dialog
  const [newDealDialogOpen, setNewDealDialogOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('Year to Date');
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Dashboard CSS is now included in index.css

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['revenue'] });
        queryClient.invalidateQueries({ queryKey: ['gp'] });

        // Finish loading
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setIsLoading(false);
      }
    };

    initializeDashboard();

    return () => {
      // Cleanup if needed
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8 max-w-[1920px] mx-auto space-y-6 pb-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-blue-600">Sales Performance Dashboard</h1>
        <div className="flex space-x-2">
          <select
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option>Year to Date</option>
            <option>Quarter to Date</option>
            <option>Month to Date</option>
            <option>Custom Range</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Top Row: Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenue Card */}
            <div className="h-[160px]">
              <RevenueCard />
            </div>

            {/* Gross Profit Card */}
            <div className="h-[160px]">
              <GrossProfitCard />
            </div>

            {/* Pipeline Card */}
            <div className="h-[160px]">
              <PipelineCard />
            </div>

            {/* Sales Leader Card */}
            <div className="h-[160px]">
              <SalesLeaderCard />
            </div>
          </div>

          {/* Second Row: Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Conversion Rate Card */}
            <div className="h-[140px]">
              <ConversionRateCard />
            </div>

            {/* Quota Completion Card */}
            <div className="h-[140px]">
              <QuotaCompletionCard />
            </div>

            {/* Win Rate Card */}
            <div className="h-[140px]">
              <WinRateCard />
            </div>

            {/* Average Deal Size Card */}
            <div className="h-[140px]">
              <AvgDealSizeCard />
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mb-8">
            <SalesLeaderboard />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend Chart */}
            <RevenueTrendChart />

            {/* Pipeline Distribution Chart */}
            <PipelineDistributionChart />
          </div>
        </>
      )}

      {/* New Deal Dialog */}
      <NewDealDialog
        open={newDealDialogOpen}
        onOpenChange={setNewDealDialogOpen}
        onDealCreated={() => {
          // Refresh all dashboard data after creating a deal without page reload
          queryClient.invalidateQueries({ queryKey: ['pipeline'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['deals'] });
        }}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8 max-w-[1920px] mx-auto space-y-6 pb-8">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-8 w-[250px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-[150px]" />
        </div>
      </div>

      {/* Top Row: Key Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={`metric-${i}`} className="bg-white p-4 shadow-md border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-2 w-full mb-2" />
            <Skeleton className="h-4 w-40" />
          </Card>
        ))}
      </div>

      {/* Second Row: Performance Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={`perf-${i}`} className="bg-white p-4 shadow-md border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-8 w-24 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>

      {/* Leaderboard Skeleton */}
      <div className="mb-8">
        <Card className="bg-white p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </Card>
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[...Array(2)].map((_, i) => (
          <Card key={`chart-${i}`} className="bg-white p-6 shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </Card>
        ))}
      </div>
    </div>
  );
}

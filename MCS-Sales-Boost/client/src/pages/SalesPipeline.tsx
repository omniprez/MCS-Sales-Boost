import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "../lib/utils";
import { usePipeline } from "../contexts/PipelineContext";
import NewDealDialog from "../components/deals/NewDealDialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { LayoutGrid, List, LayoutDashboard, Users, BarChart } from "lucide-react";
import PipelineStageColumn from "../components/pipeline/PipelineStageColumn";
import CollapsibleDealCard from "../components/pipeline/CollapsibleDealCard";
import DealListView from "../components/pipeline/DealListView";

const SalesPipeline = () => {
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  // Fixed on condensed density
  const density = "condensed";
  const [newDealDialogOpen, setNewDealDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get the pipeline context
  const { getPipelineData } = usePipeline();

  // Always fetch fresh pipeline data from the API
  const { data: pipelineData, isLoading, refetch } = useQuery({
    queryKey: ['pipeline'],
    queryFn: async () => {
      console.log('Fetching pipeline data from API');
      const response = await fetch('/api/pipeline', {
        credentials: 'include',
        cache: 'no-cache', // Ensure we don't get cached data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline data');
      }
      const data = await response.json();
      console.log('Pipeline data from API:', data.length, 'deals');
      console.log('Deal stages:', data.map((d: any) => d.stage).join(', '));
      return data;
    },
    staleTime: 0, // No stale time - always refetch
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: 5000 // Refetch every 5 seconds
  });

  // Force a refetch when the component mounts
  useEffect(() => {
    console.log('SalesPipeline component mounted, forcing refetch');

    // Clear any cached pipeline data from localStorage
    if (localStorage.getItem('salesSpark_pipelineData')) {
      console.log('Removing cached pipeline data from localStorage');
      localStorage.removeItem('salesSpark_pipelineData');
    }

    refetch();
  }, [refetch]);

  // Filter pipeline data based on category and team
  const filteredPipeline = pipelineData ? pipelineData.filter((deal: any) => {
    return (
      (filterCategory === "all" || deal.category === filterCategory) &&
      (filterTeam === "all" || (filterTeam === "internal" ? !deal.user.isChannelPartner : deal.user.isChannelPartner))
    );
  }) : [];

  // Group deals by stage
  const dealsByStage = filteredPipeline.reduce((acc: any, deal: any) => {
    if (!acc[deal.stage]) {
      acc[deal.stage] = [];
    }
    acc[deal.stage].push(deal);
    return acc;
  }, {
    prospecting: [],
    qualification: [],
    proposal: [],
    negotiation: [],
    closed_won: [],
    closed_lost: [],
  });

  // Calculate stage totals
  const stageTotals = Object.keys(dealsByStage).reduce((acc: any, stage: string) => {
    const stageDeals = dealsByStage[stage] || [];
    acc[stage] = {
      count: stageDeals.length,
      value: stageDeals.reduce((sum: number, deal: any) => {
        // Ensure deal.value is a valid number
        const dealValue = typeof deal.value === 'number' && !isNaN(deal.value) ? deal.value : 0;
        return sum + dealValue;
      }, 0)
    };
    return acc;
  }, {});

  // Ensure all stages exist with default values
  const allStages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  allStages.forEach(stage => {
    if (!stageTotals[stage]) {
      stageTotals[stage] = { count: 0, value: 0 };
    }
  });

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8 max-w-[1920px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 mt-8 lg:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Sales Pipeline</h1>
          <p className="text-gray-500 mt-1">Track your deals from lead to close</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-3">
            {/* View toggle */}
            <div className="flex border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                className={`rounded-none border-0 ${viewMode === "kanban" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className={`rounded-none border-0 ${viewMode === "list" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">List</span>
              </Button>
            </div>

            {/* Density is fixed to condensed */}

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] shadow-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="wireless">Wireless</SelectItem>
                <SelectItem value="fiber">Fiber</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-[140px] shadow-sm">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="partner">Channel Partners</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
            onClick={() => setNewDealDialogOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Deal</span>
          </Button>
        </div>
      </div>

      {/* Pipeline Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-blue-600">Total Pipeline Value</h3>
          {isLoading ? (
            <div className="text-2xl font-bold mt-1 text-gray-900">
              <Skeleton className="h-8 w-24" />
            </div>
          ) : (
            <p className="text-2xl font-bold mt-1 text-gray-900">
              {(() => {
                // Calculate total pipeline value with proper NaN handling
                const totalValue = Object.values(stageTotals).reduce((sum: number, stage: any) => {
                  const stageValue = typeof stage.value === 'number' && !isNaN(stage.value) ? stage.value : 0;
                  return sum + stageValue;
                }, 0);

                return formatCurrency(totalValue);
              })()}
            </p>
          )}
          {/* Only show progress bar if there's actual value */}
          {Object.values(stageTotals).reduce((sum: number, stage: any) => sum + stage.value, 0) > 0 && (
            <div className="h-2 w-full bg-gray-200 mt-2 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-blue-600">Win Rate</h3>
          {isLoading ? (
            <div className="text-2xl font-bold mt-1 text-gray-900">
              <Skeleton className="h-8 w-24" />
            </div>
          ) : (
            <p className="text-2xl font-bold mt-1 text-gray-900">
              {(() => {
                const totalClosedDeals = stageTotals.closed_won.count + stageTotals.closed_lost.count;
                const winRate = totalClosedDeals > 0
                  ? Math.round((stageTotals.closed_won.count / totalClosedDeals) * 100)
                  : 0;
                return `${winRate}%`;
              })()}
            </p>
          )}
          {/* Only show progress bar if there are closed deals */}
          {(stageTotals.closed_won.count + (stageTotals.closed_lost?.count || 0)) > 0 && (
            <div className="h-2 w-full bg-gray-200 mt-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${Math.round((stageTotals.closed_won.count / (stageTotals.closed_won.count + (stageTotals.closed_lost?.count || 0))) * 100) || 0}%`
                }}
              ></div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-blue-600">Average Deal Size</h3>
          {isLoading ? (
            <div className="text-2xl font-bold mt-1 text-gray-900">
              <Skeleton className="h-8 w-24" />
            </div>
          ) : (
            <p className="text-2xl font-bold mt-1 text-gray-900">
              {(() => {
                // Calculate total value with proper NaN handling
                const totalValue = filteredPipeline.reduce((sum: number, deal: any) => {
                  const dealValue = typeof deal.value === 'number' && !isNaN(deal.value) ? deal.value : 0;
                  return sum + dealValue;
                }, 0);

                // Calculate average with zero division protection
                const avgDealSize = filteredPipeline.length > 0 ? totalValue / filteredPipeline.length : 0;

                return formatCurrency(avgDealSize);
              })()}
            </p>
          )}
          {/* Only show progress bar if there are deals */}
          {filteredPipeline.length > 0 && (
            <div className="h-2 w-full bg-gray-200 mt-2 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-blue-600">Deals Closing This Month</h3>
          {isLoading ? (
            <div className="text-2xl font-bold mt-1 text-gray-900">
              <Skeleton className="h-8 w-24" />
            </div>
          ) : (
            <p className="text-2xl font-bold mt-1 text-gray-900">
              {filteredPipeline.filter((deal: any) => deal.stage === 'negotiation').length}
            </p>
          )}
          {/* Only show progress bar if there are deals in negotiation */}
          {filteredPipeline.filter((deal: any) => deal.stage === 'negotiation').length > 0 && (
            <div className="h-2 w-full bg-gray-200 mt-2 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline views */}
      {isLoading ? (
        viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[500px] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <Skeleton className="h-[500px] w-full rounded-xl" />
        )
      ) : viewMode === "list" ? (
        // List View
        <DealListView deals={filteredPipeline} isLoading={isLoading} />
      ) : (
        // Kanban View
        <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto`}>
          <PipelineStageColumn
            title="Prospecting"
            count={stageTotals.prospecting.count}
            value={stageTotals.prospecting.value}
          >
            {dealsByStage.prospecting.map((deal: any) => (
              <CollapsibleDealCard key={deal.id} deal={deal} />
            ))}
          </PipelineStageColumn>

          <PipelineStageColumn
            title="Qualification"
            count={stageTotals.qualification.count}
            value={stageTotals.qualification.value}
          >
            {dealsByStage.qualification.map((deal: any) => (
              <CollapsibleDealCard key={deal.id} deal={deal} />
            ))}
          </PipelineStageColumn>

          <PipelineStageColumn
            title="Proposal"
            count={stageTotals.proposal.count}
            value={stageTotals.proposal.value}
          >
            {dealsByStage.proposal.map((deal: any) => (
              <CollapsibleDealCard key={deal.id} deal={deal} />
            ))}
          </PipelineStageColumn>

          <PipelineStageColumn
            title="Negotiation"
            count={stageTotals.negotiation.count}
            value={stageTotals.negotiation.value}
          >
            {dealsByStage.negotiation.map((deal: any) => (
              <CollapsibleDealCard key={deal.id} deal={deal} />
            ))}
          </PipelineStageColumn>

          <PipelineStageColumn
            title="Closed Won"
            count={stageTotals.closed_won.count}
            value={stageTotals.closed_won.value}
            highlight
          >
            {dealsByStage.closed_won.map((deal: any) => (
              <CollapsibleDealCard key={deal.id} deal={deal} />
            ))}
          </PipelineStageColumn>

          <PipelineStageColumn
            title="Closed Lost"
            count={stageTotals.closed_lost?.count || 0}
            value={stageTotals.closed_lost?.value || 0}
            highlight="negative"
          >
            {(dealsByStage.closed_lost || []).map((deal: any) => (
              <CollapsibleDealCard key={deal.id} deal={deal} />
            ))}
          </PipelineStageColumn>
        </div>
      )}

      {/* New Deal Dialog */}
      <NewDealDialog
        open={newDealDialogOpen}
        onOpenChange={setNewDealDialogOpen}
        onDealCreated={() => {
          // Refresh data after creating a deal
          queryClient.invalidateQueries({ queryKey: ['pipeline'] });
        }}
      />
    </div>
  );
};

export default SalesPipeline;

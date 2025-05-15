import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { ChevronRight, Check, X, Copy } from "lucide-react";
import { toast } from "../ui/use-toast";

interface DealStageTransitionProps {
  dealId: number;
  currentStage: string;
  compact?: boolean;
}

const stages = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"];

export function DealStageTransition({ dealId, currentStage, compact = false }: DealStageTransitionProps) {
  const queryClient = useQueryClient();
  const currentIndex = stages.indexOf(currentStage);
  const nextStage = currentIndex < stages.length - 3 ? stages[currentIndex + 1] : null;

  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: number; stage: string }) => {
      console.log(`Updating deal ${dealId} to stage ${stage}`);

      // Add a delay to ensure the request is processed
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch(`/api/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ stage }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update deal stage');
      }

      const result = await response.json();
      console.log('Stage update API response:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('Stage update successful:', data);

      // Refresh all relevant data without page reload
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });

      // Clear any cached pipeline data
      if (localStorage.getItem('salesSpark_pipelineData')) {
        localStorage.removeItem('salesSpark_pipelineData');
      }

      // Show success toast
      toast({
        title: "Stage updated",
        description: `Deal moved to ${variables.stage.replace('_', ' ')}`,
        variant: "default",
      });
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update stage",
        variant: "destructive",
      });
    }
  });

  const handleMoveToNextStage = () => {
    if (nextStage) {
      updateStageMutation.mutate({ dealId, stage: nextStage });
    }
  };

  const handleCloseWon = () => {
    updateStageMutation.mutate({ dealId, stage: 'closed_won' });
  };

  const handleCloseLost = () => {
    updateStageMutation.mutate({ dealId, stage: 'closed_lost' });
  };

  // WIP functionality removed

  // If the deal is closed lost, don't show any buttons
  if (currentStage === 'closed_lost') {
    return null;
  }

  // If the deal is closed won, don't show any buttons
  if (currentStage === 'closed_won') {
    return null;
  }

  if (compact) {
    // Compact version for pipeline cards
    return (
      <div className="flex space-x-1 mt-2">
        {nextStage && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
            onClick={handleMoveToNextStage}
            disabled={updateStageMutation.isPending}
          >
            Next <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs text-green-600 border-green-600 hover:bg-green-50"
          onClick={handleCloseWon}
          disabled={updateStageMutation.isPending}
        >
          <Check className="h-3 w-3" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs text-red-600 border-red-600 hover:bg-red-50"
          onClick={handleCloseLost}
          disabled={updateStageMutation.isPending}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Full version for detail pages
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {nextStage && (
        <Button
          size="sm"
          variant="outline"
          className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
          onClick={handleMoveToNextStage}
          disabled={updateStageMutation.isPending}
        >
          Move to {nextStage.replace('_', ' ')} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        className="text-green-600 border-green-600 hover:bg-green-50"
        onClick={handleCloseWon}
        disabled={updateStageMutation.isPending}
      >
        Mark as Won <Check className="ml-1 h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-600 hover:bg-red-50"
        onClick={handleCloseLost}
        disabled={updateStageMutation.isPending}
      >
        Mark as Lost <X className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

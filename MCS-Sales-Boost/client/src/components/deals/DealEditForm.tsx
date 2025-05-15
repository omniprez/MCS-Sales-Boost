import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "../ui/use-toast";
import { formatCurrency } from "../../lib/utils";
import { X, Trash2, Save } from "lucide-react";
import { usePipeline } from "../../contexts/PipelineContext";
import { useAuth } from "../../contexts/AuthContext";
import { apiRequest } from "../../lib/queryClient";

interface DealEditFormProps {
  deal: {
    id: number;
    name: string;
    value: number;
    category: string;
    stage: string;
    clientType: string;
    daysInStage: number;
    contractLength?: number;
    user: {
      name: string;
      avatar?: string;
    };
    customer: {
      name: string;
    };
  };
  onClose: () => void;
  isDialog?: boolean;
}

const DealEditForm = ({ deal, onClose, isDialog = false }: DealEditFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    value: deal.value,
    category: deal.category,
    stage: deal.stage,
    clientType: deal.clientType,
    contractLength: deal.contractLength || 12,
  });

  // Calculate derived values
  const mrr = formData.value / (formData.contractLength || 12);
  const tcv = formData.value;

  // Use the pipeline context for updating deals
  const { updateDeal: updatePipelineDeal, removeDeal } = usePipeline();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Get the auth context to check if user is admin
  const { hasRole } = useAuth();

  // Check if the current user is an admin
  useEffect(() => {
    const adminStatus = hasRole('admin');
    console.log('DealEditForm: User is admin:', adminStatus);
    setIsAdmin(adminStatus);
  }, [hasRole]);

  const handleUpdateDeal = async (updatedDealData: any) => {
    setIsUpdating(true);
    console.log('Updating deal with data:', updatedDealData);
    console.log('Deal name being updated to:', updatedDealData.name);

    try {
      // First, update the stage if it has changed
      if (updatedDealData.stage !== deal.stage) {
        console.log(`Updating deal stage from ${deal.stage} to ${updatedDealData.stage}`);

        // Call the API to update the stage
        const stageResponse = await apiRequest('PATCH', `/api/deals/${deal.id}/stage`, {
          stage: updatedDealData.stage
        });

        console.log('Stage update response:', stageResponse);
      }

      // Then update the other deal properties
      console.log(`Updating other deal properties for deal ${deal.id}`);

      // Create a clean update object with only the fields we want to update
      const updatePayload = {
        value: Number(updatedDealData.value),
        category: String(updatedDealData.category),
        clientType: String(updatedDealData.clientType),
        contractLength: Number(updatedDealData.contractLength)
      };

      console.log('Sending update payload:', JSON.stringify(updatePayload, null, 2));

      // Then update the other properties using the same direct approach
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify(updatePayload)
      });

      const updateResponse = await response.json();

      console.log('Deal update response:', updateResponse);

      // Update the deal in the pipeline context
      console.log('Updating pipeline context with deal data:', updatedDealData);
      updatePipelineDeal(deal.id, {
        value: updatedDealData.value,
        category: updatedDealData.category,
        stage: updatedDealData.stage,
        clientType: updatedDealData.clientType,
        contractLength: updatedDealData.contractLength
      });

      // Show success toast
      toast({
        title: "Deal updated",
        description: "The deal has been successfully updated",
        variant: "default",
      });

      // Refresh all relevant data without page reload
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });

      // Clear any cached pipeline data
      if (localStorage.getItem('salesSpark_pipelineData')) {
        localStorage.removeItem('salesSpark_pipelineData');
      }

      // Close the dialog after successful update
      // Add a delay to ensure the UI updates properly
      setTimeout(() => {
        setIsUpdating(false);
        // Don't automatically close the dialog
      }, 1000);
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update deal",
        variant: "destructive",
      });
      setIsUpdating(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!confirm(`Are you sure you want to delete this deal: ${deal.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // We don't need to check localStorage for login status since we're using the auth context
      // This was causing issues with session management

      // Call the API to delete the deal
      console.log(`Deleting deal with ID: ${deal.id}`);
      const response = await apiRequest('DELETE', `/api/deals/${deal.id}`);
      console.log('Delete response:', response);

      // Remove from pipeline context
      removeDeal(deal.id);

      // Show success toast
      toast({
        title: "Deal deleted",
        description: "The deal has been successfully deleted",
        variant: "default",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      // Close the form
      onClose();
    } catch (error) {
      console.error('Error deleting deal:', error);

      // Show more detailed error message
      let errorMessage = "Failed to delete deal";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Show error toast without redirecting
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const updateDealMutation = {
    mutate: handleUpdateDeal,
    isPending: isUpdating
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);

    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: name === 'value' || name === 'contractLength' ? Number(value) : value
      };
      console.log('Updated form data:', newFormData);
      return newFormData;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create a clean copy of the form data
    const cleanData = {
      value: formData.value,
      category: formData.category,
      stage: formData.stage,
      clientType: formData.clientType,
      contractLength: formData.contractLength
    };

    console.log('Form submitted with data:', cleanData);

    // Use the clean data for the mutation
    updateDealMutation.mutate(cleanData);
  };

  const formClasses = isDialog
    ? "bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
    : "bg-white p-4 rounded-lg border border-gray-200";

  return (
    <div className={formClasses}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Edit Deal</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value">Deal Value</Label>
              <Input
                id="value"
                name="value"
                type="number"
                value={formData.value}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contractLength">Contract Length (months)</Label>
              <Input
                id="contractLength"
                name="contractLength"
                type="number"
                value={formData.contractLength}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monthly Recurring Revenue</Label>
              <div className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                {formatCurrency(mrr)}
              </div>
            </div>
            <div>
              <Label>Total Contract Value</Label>
              <div className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                {formatCurrency(tcv)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wireless">Wireless</SelectItem>
                  <SelectItem value="fiber">Fiber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="clientType">Client Type</Label>
              <Select
                value={formData.clientType}
                onValueChange={(value) => handleSelectChange('clientType', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="sme">SME</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="stage">Stage</Label>
            <Select
              value={formData.stage}
              onValueChange={(value) => handleSelectChange('stage', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospecting">Prospecting</SelectItem>
                <SelectItem value="qualification">Qualification</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed_won">Closed Won</SelectItem>
                <SelectItem value="closed_lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Non-admin message */}
          {!isAdmin && (
            <div className="text-xs text-gray-500 italic flex items-center pt-4 mb-2">
              <span>Only admins can delete deals</span>
            </div>
          )}

          {/* Save/Cancel/Delete Buttons */}
          <div className="flex justify-between pt-4">
            {/* Left side - Delete button for admins */}
            <div>
              {isAdmin && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteDeal}
                  disabled={isDeleting || updateDealMutation.isPending}
                  className="flex items-center bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>

            {/* Right side - Cancel and Save buttons */}
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateDealMutation.isPending || isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateDealMutation.isPending || isDeleting}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                {updateDealMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </form>


    </div>
  );
};

export default DealEditForm;

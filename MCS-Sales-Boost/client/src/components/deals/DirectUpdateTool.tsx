import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from '../ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface DirectUpdateToolProps {
  dealId: number;
  currentName: string;
}

const DirectUpdateTool: React.FC<DirectUpdateToolProps> = ({ dealId, currentName }) => {
  const [newName, setNewName] = useState(currentName);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleUpdate = async () => {
    if (!newName.trim()) {
      toast({
        title: "Error",
        description: "Deal name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      // Try the admin endpoint first
      let response = await fetch('/api/admin/direct-update-deal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dealId, name: newName }),
      });

      // If that fails, try the direct SQL endpoint
      if (!response.ok) {
        console.log('Admin endpoint failed, trying direct SQL endpoint');
        response = await fetch('/api/direct-update-deal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dealId, name: newName }),
        });
      }

      const result = await response.json();
      console.log('Direct update result:', result);

      if (result.success) {
        toast({
          title: "Success",
          description: "Deal name updated successfully",
          variant: "default",
        });

        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update deal name",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating deal name:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 border border-red-200 rounded-lg bg-white shadow-sm mt-4">
      <h3 className="text-sm font-semibold mb-2 text-red-600">Admin Direct Update Tool</h3>
      <p className="text-xs text-gray-500 mb-3">
        This tool bypasses authentication and directly updates the database. Use only when regular updates fail.
      </p>
      <div className="space-y-2">
        <Label htmlFor="directName">New Deal Name</Label>
        <Input
          id="directName"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter new deal name"
        />
        <Button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
        >
          {isUpdating ? "Updating..." : "Direct Update Deal Name"}
        </Button>
      </div>
    </div>
  );
};

export default DirectUpdateTool;

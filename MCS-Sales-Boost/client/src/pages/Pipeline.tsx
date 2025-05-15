import React, { useState, useEffect } from 'react';
import SalesPipeline from './SalesPipeline';
import NewDealDialog from '../components/deals/NewDealDialog';
import { useQueryClient } from '@tanstack/react-query';

function Pipeline() {
  const [newDealDialogOpen, setNewDealDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Listen for the custom event to open the new deal dialog
  useEffect(() => {
    const handleOpenNewDealDialog = () => {
      setNewDealDialogOpen(true);
    };

    window.addEventListener('openNewDealDialog', handleOpenNewDealDialog);

    return () => {
      window.removeEventListener('openNewDealDialog', handleOpenNewDealDialog);
    };
  }, []);

  return (
    <>
      <SalesPipeline />

      {/* New Deal Dialog */}
      <NewDealDialog
        open={newDealDialogOpen}
        onOpenChange={setNewDealDialogOpen}
        onDealCreated={() => {
          // Refresh data after creating a deal
          queryClient.invalidateQueries({ queryKey: ['pipeline'] });
        }}
      />
    </>
  );
}

export default Pipeline;

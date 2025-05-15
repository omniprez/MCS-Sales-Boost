import React from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay
} from "../ui/dialog";
import DealEditForm from "./DealEditForm";

interface DealEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
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
}

const DealEditDialog = ({ isOpen, onClose, deal }: DealEditDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/50" />
      <DialogContent className="sm:max-w-md p-0 border-none bg-transparent shadow-none" hideCloseButton>
        <DealEditForm deal={deal} onClose={onClose} isDialog={true} />
      </DialogContent>
    </Dialog>
  );
};

export default DealEditDialog;

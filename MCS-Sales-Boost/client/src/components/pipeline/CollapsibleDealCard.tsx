import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import DealEditDialog from "../deals/DealEditDialog";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";

// Calculate Total GP: 40% of TCV (Total Contract Value)
const calculateTotalGP = (value: number): number => {
  // Calculate GP: 40% of TCV
  return value * 0.4;
};

interface CollapsibleDealCardProps {
  deal: {
    id: number;
    name: string;
    value: number;
    category: string;
    stage: string;
    clientType: string;
    daysInStage: number;
    contractLength?: number;
    createdAt?: string;
    user: {
      id: number;
      name: string;
      avatar?: string;
    };
    customer: {
      name: string;
    };
  };
}

const CollapsibleDealCard = ({ deal }: CollapsibleDealCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const { user } = useAuth();

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'proposal': return 'text-blue-600';
      case 'negotiation': return 'text-amber-600';
      case 'qualification': return 'text-red-600';
      case 'closed_won': return 'text-green-600';
      case 'closed_lost': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryDot = (category: string) => {
    return category === 'wireless' ? 'bg-blue-500' : 'bg-emerald-500';
  };

  const formatStage = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ');
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Check if the current user can edit this deal (owner or admin)
  useEffect(() => {
    if (user && deal && deal.user) {
      // User can edit if they are the owner of the deal or if they are an admin
      const isOwner = deal.user.id === user.id;
      const isAdmin = user.role === 'admin' || user.role === 'administrator' || user.role === 'superuser';
      setCanEdit(isOwner || isAdmin);
    } else {
      setCanEdit(false);
    }
  }, [user, deal]);

  return (
    <motion.div
      className="rounded-lg border border-gray-200 bg-white hover:cursor-pointer overflow-hidden mb-3 shadow-sm hover:shadow transition-shadow"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Collapsed header - always visible */}
      <div
        className="p-3 flex flex-col hover:bg-gray-50"
        onClick={toggleExpand}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full ${getCategoryDot(deal.category)} mr-2`}></span>
            <h4 className="font-medium text-sm truncate max-w-[110px] sm:max-w-[150px] text-gray-900">{deal.customer?.name || deal.name}</h4>
          </div>
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500 p-1 rounded-full shadow-sm" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500 p-1 rounded-full shadow-sm" />
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="text-xs text-gray-500">Total GP:</div>
          <p className="font-semibold text-xs text-gray-900">{formatCurrency(calculateTotalGP(deal.value))}</p>
        </div>
      </div>

      {/* Expanded content - only visible when expanded */}
      {isExpanded && (
        <div className="p-3 pt-0 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center">
              <p className="text-xs text-gray-500">MRR</p>
              <p className="text-xs font-semibold text-gray-900">{formatCurrency(deal.value / (deal.contractLength || 12))}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">TCV</p>
              <p className="text-xs font-semibold text-gray-900">{formatCurrency(deal.value)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Terms</p>
              <p className="text-xs font-semibold text-gray-900">{deal.contractLength || 12} months</p>
            </div>
          </div>

          {/* Creation date */}
          {deal.createdAt && (
            <div className="flex items-center mt-3 text-xs text-gray-500 justify-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Created: {format(new Date(deal.createdAt), "MMM d, yyyy")}</span>
            </div>
          )}

          {/* Edit button - only shown if user can edit */}
          <div className="flex justify-center mt-3">
            {canEdit ? (
              <button
                className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditDialogOpen(true);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            ) : (
              <div className="text-xs text-gray-500 italic">
                {deal.user.name}'s deal
              </div>
            )}
          </div>
        </div>
      )}
      {/* Edit Dialog */}
      <DealEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        deal={deal}
      />
    </motion.div>
  );
};

export default CollapsibleDealCard;

import React from "react";
import { motion } from "framer-motion";
import { DealStageTransition } from "../deals/DealStageTransition";
import { formatCurrency } from "../../lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Copy, Calendar } from "lucide-react";
import { toast } from "../ui/use-toast";
import { format } from "date-fns";

// Calculate Total GP: 40% of TCV (Total Contract Value)
const calculateTotalGP = (value: number): number => {
  // Calculate GP: 40% of TCV
  return value * 0.4;
};

interface DealCardProps {
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
      name: string;
      avatar?: string;
    };
    customer: {
      name: string;
    };
  };
}

const DealCard = ({ deal }: DealCardProps) => {
  const queryClient = useQueryClient();

  // WIP functionality removed

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'proposal': return 'text-[#0052CC]';
      case 'negotiation': return 'text-[#FFAB00]';
      case 'qualification': return 'text-[#FF5630]';
      case 'closed_won': return 'text-[#36B37E]';
      default: return 'text-[#6B778C]';
    }
  };

  const getCategoryDot = (category: string) => {
    return category === 'wireless' ? 'bg-blue-500' : 'bg-green-500';
  };

  const formatStage = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ');
  };

  return (
    <motion.div
      className="rounded-lg p-4 border border-[#DFE1E6] bg-white hover:cursor-pointer hover:bg-[rgba(0,82,204,0.05)]"
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full ${getCategoryDot(deal.category)} mr-2`}></span>
            <h4 className="font-medium text-sm truncate max-w-[110px] sm:max-w-[150px]">{deal.name}</h4>
          </div>
          <p className="text-xs text-[#6B778C] mt-1 truncate max-w-[110px] sm:max-w-[150px]">
            {deal.clientType} • {deal.category === 'wireless' ? 'Wireless' : 'Fiber'}
          </p>
        </div>
        <div className="text-right">
          <div className="flex flex-col">
            <div className="flex items-center justify-end">
              <span className="text-xs text-[#6B778C] mr-1">Total GP:</span>
              <p className="font-semibold">{formatCurrency(calculateTotalGP(deal.value))}</p>
            </div>
            <p className={`text-xs ${getStageColor(deal.stage)} mt-1`}>
              {formatStage(deal.stage)} • {deal.daysInStage} days
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center">
          {deal.user && (
            <>
              {deal.user.avatar ? (
                <img src={deal.user.avatar} alt={deal.user.name} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs">
                  {deal.user.name.charAt(0)}
                </div>
              )}
              <p className="text-xs text-[#6B778C] ml-2 truncate max-w-[40px] sm:max-w-[80px]">{deal.user.name}</p>
            </>
          )}
        </div>
        <div className="flex">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            {deal.category === 'wireless' ? 'Wireless' : 'Fiber'}
          </span>
        </div>
      </div>

      {/* Creation date */}
      {deal.createdAt && (
        <div className="flex items-center mt-2 text-xs text-[#6B778C]">
          <Calendar className="h-3 w-3 mr-1" />
          <span>Created: {format(new Date(deal.createdAt), "MMM d, yyyy")}</span>
        </div>
      )}

      {/* Add stage transition buttons */}
      <DealStageTransition dealId={deal.id} currentStage={deal.stage} compact={true} />
    </motion.div>
  );
};

export default DealCard;

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card";

interface TeamCardProps {
  id: number;
  name: string;
  region: string;
  memberCount: number;
  type: string;
}

const TeamCard = ({ id, name, region, memberCount, type }: TeamCardProps) => {
  const getTeamTypeColor = () => {
    return type === "internal" ? "bg-blue-500" : "bg-green-500";
  };

  const getTeamTypeLabel = () => {
    return type === "internal" ? "Internal Team" : "Channel Partner";
  };

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="h-1.5 w-full bg-[#0052CC]"></div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg">{name}</h3>
              <div className="flex items-center mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#6B778C] mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-[#6B778C]">{region}</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-[#FAFBFC] rounded-full w-12 h-12 flex items-center justify-center">
                <span className="font-bold text-[#0052CC]">{memberCount}</span>
              </div>
              <span className="text-xs text-[#6B778C] mt-1">Members</span>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <span className={`w-2 h-2 rounded-full ${getTeamTypeColor()} mr-1.5`}></span>
              {getTeamTypeLabel()}
            </span>
            <button className="text-[#0052CC] text-sm hover:underline">
              View Details
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeamCard;

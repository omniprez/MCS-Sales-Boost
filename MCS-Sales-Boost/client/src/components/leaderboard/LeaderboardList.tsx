import React from "react";
import { motion } from "framer-motion";

interface LeaderboardListProps {
  leaderboard: Array<{
    userId: number;
    name: string;
    revenue: number;
    dealsWon: number;
    gpPercentage: number;
    growth: number;
    avatar?: string;
    teamType: string;
  }>;
}

const LeaderboardList = ({ leaderboard }: LeaderboardListProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {leaderboard.length > 0 ? (
        leaderboard.map((entry, index) => (
          <LeaderboardEntry 
            key={entry.userId}
            rank={index + 1}
            name={entry.name}
            team={entry.teamType}
            avatar={entry.avatar}
            revenue={entry.revenue}
            dealsWon={entry.dealsWon}
            gpPercentage={entry.gpPercentage}
            growth={entry.growth}
            variants={item}
          />
        ))
      ) : (
        <div className="text-center py-8 text-[#6B778C]">
          <p>No data available for the selected filters</p>
        </div>
      )}
    </motion.div>
  );
};

interface LeaderboardEntryProps {
  rank: number;
  name: string;
  team: string;
  avatar?: string;
  revenue: number;
  dealsWon: number;
  gpPercentage: number;
  growth: number;
  variants?: any;
}

const LeaderboardEntry = ({ 
  rank, 
  name, 
  team, 
  avatar, 
  revenue, 
  dealsWon,
  gpPercentage,
  growth,
  variants 
}: LeaderboardEntryProps) => {
  const getRankColor = () => {
    switch (rank) {
      case 1: return 'bg-[#0052CC]';
      case 2: return 'bg-[#36B37E]';
      case 3: return 'bg-[#FF5630]';
      default: return 'bg-[#6B778C]';
    }
  };

  const getRankSize = () => {
    return rank <= 3 ? 'w-10 h-10' : 'w-8 h-8';
  };

  return (
    <motion.div 
      className="flex items-center justify-between p-4 rounded-lg bg-[#FAFBFC] hover:bg-[rgba(0,82,204,0.05)] transition-colors"
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      variants={variants}
    >
      <div className="flex items-center">
        <div className={`${getRankSize()} rounded-full ${getRankColor()} text-white flex items-center justify-center font-bold mr-4`}>
          {rank}
        </div>
        <div className="flex items-center">
          {avatar ? (
            <img src={avatar} alt={name} className="w-10 h-10 rounded-full mr-3" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-sm mr-3">
              {name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-[#6B778C]">{team}</p>
          </div>
        </div>
      </div>
      
      <div className="hidden md:flex items-center space-x-8">
        <div className="text-center">
          <p className="text-[#6B778C] text-sm">Deals</p>
          <p className="font-medium">{dealsWon}</p>
        </div>
        <div className="text-center">
          <p className="text-[#6B778C] text-sm">GP %</p>
          <p className="font-medium">{gpPercentage}%</p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-bold">${revenue.toLocaleString()}</p>
        <div className="flex items-center justify-end">
          {growth >= 0 ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#36B37E] mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#FF5630] mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          <p className={`text-xs ${growth >= 0 ? 'text-[#36B37E]' : 'text-[#FF5630]'}`}>
            {growth >= 0 ? '+' : ''}{growth}%
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LeaderboardList;

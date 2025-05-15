import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

// Define interface for performer data
interface Performer {
  id?: string;
  name: string;
  role?: string;
  avatar?: string;
  revenue?: number;
  deals?: number;
}

const LeaderboardWidget = () => {
  const { data: leaderboard = [], isLoading } = useQuery<Performer[]>({
    queryKey: ['/api/leaderboard'],
  });

  // Get top performer from leaderboard
  const topPerformer = Array.isArray(leaderboard) && leaderboard.length > 0 ? leaderboard[0] : null;

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <button className="flex items-center text-xs font-medium text-[#6B778C] hover:text-[#172B4D]">
            <span>This Quarter</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
        {isLoading ? (
          <>
            <Skeleton className="w-full h-24 mb-6" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-16" />
              ))}
            </div>
          </>
        ) : (
          <>
            {topPerformer && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#FFAB00] bg-opacity-10 rounded-full text-[#FFAB00] mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Top Performer</h3>
                    <p className="text-xs text-[#6B778C]">Based on total revenue</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${topPerformer?.revenue ? topPerformer.revenue.toLocaleString() : '0'}</p>
                  <div className="flex items-center justify-end">
                    {topPerformer.avatar ? (
                      <img src={topPerformer.avatar} alt={topPerformer.name} className="w-5 h-5 rounded-full mr-1" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs mr-1">
                        {topPerformer.name.charAt(0)}
                      </div>
                    )}
                    <p className="text-xs">{topPerformer.name}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {Array.isArray(leaderboard) && leaderboard.length > 0 && leaderboard.slice(0, 5).map((entry: Performer, index: number) => (
                <LeaderboardEntry
                  key={entry.id || index}
                  rank={index + 1}
                  name={entry.name}
                  team={entry.role || 'Sales Rep'}
                  avatar={entry.avatar}
                  revenue={entry.revenue || 0}
                  growth={0}
                />
              ))}
            </div>

            <div className="mt-6 flex space-x-2">
              <div className="flex-1">
                <div className="text-center p-3 rounded-lg border border-[#DFE1E6] hover:border-[#0052CC] cursor-pointer">
                  <div className="flex justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FFAB00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-sm">Your Rank</h4>
                  <p className="font-bold text-lg mt-1">8th</p>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-center p-3 rounded-lg border border-[#DFE1E6] hover:border-[#0052CC] cursor-pointer">
                  <div className="flex justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0052CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-sm">Achievements</h4>
                  <p className="font-bold text-lg mt-1">12</p>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
};

interface LeaderboardEntryProps {
  rank: number;
  name: string;
  team: string;
  avatar?: string;
  revenue: number;
  growth: number;
}

const LeaderboardEntry = ({ rank, name, team, avatar, revenue, growth }: LeaderboardEntryProps) => {
  const getRankColor = () => {
    switch (rank) {
      case 1: return 'bg-[#0052CC]';
      case 2: return 'bg-[#36B37E]';
      case 3: return 'bg-[#FF5630]';
      default: return 'bg-[#6B778C]';
    }
  };

  return (
    <motion.div
      className="flex items-center justify-between p-3 rounded-lg bg-[#FAFBFC]"
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center">
        <div className={`w-7 h-7 rounded-full ${getRankColor()} text-white flex items-center justify-center text-xs font-bold mr-3`}>
          {rank}
        </div>
        <div className="flex items-center">
          {avatar ? (
            <img src={avatar} alt={name} className="w-8 h-8 rounded-full mr-3" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-sm mr-3">
              {name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-[#6B778C]">{team}</p>
          </div>
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

export default LeaderboardWidget;

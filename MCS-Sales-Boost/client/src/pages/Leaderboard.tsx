import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import LeaderboardList from "../components/leaderboard/LeaderboardList";
import AchievementCard from "../components/leaderboard/AchievementCard";

function Leaderboard() {
  const [period, setPeriod] = useState("quarter");
  const [teamFilter, setTeamFilter] = useState("all");

  // Define the type for leaderboard entries
  interface LeaderboardEntry {
    userId: number;
    name: string;
    revenue: number;
    dealsWon: number;
    gpPercentage: number;
    growth: number;
    avatar?: string;
    teamType: string;
  }

  // Fetch leaderboard data
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard'],
  });

  // Filter leaderboard based on team type
  const filteredLeaderboard = leaderboard.filter((entry) => {
    if (teamFilter === "all") return true;
    return teamFilter === "internal"
      ? entry.teamType === "Internal Sales"
      : entry.teamType === "Channel Partner";
  });

  return (
    <div className="container mx-auto px-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 mt-12 lg:mt-0">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-[#6B778C] mt-1">See who's leading the sales race</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="w-[300px]">
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="quarter">Quarter</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Team filter */}
      <div className="mb-8">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              teamFilter === "all"
                ? "bg-[#0052CC] text-white"
                : "bg-white border border-[#DFE1E6] text-[#6B778C] hover:bg-[#FAFBFC]"
            }`}
            onClick={() => setTeamFilter("all")}
          >
            All Teams
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              teamFilter === "internal"
                ? "bg-[#0052CC] text-white"
                : "bg-white border border-[#DFE1E6] text-[#6B778C] hover:bg-[#FAFBFC]"
            }`}
            onClick={() => setTeamFilter("internal")}
          >
            Internal Sales
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              teamFilter === "partner"
                ? "bg-[#0052CC] text-white"
                : "bg-white border border-[#DFE1E6] text-[#6B778C] hover:bg-[#FAFBFC]"
            }`}
            onClick={() => setTeamFilter("partner")}
          >
            Channel Partners
          </button>
        </div>
      </div>

      {/* Leaderboard content */}
      <Tabs value={period} defaultValue="quarter">
        <TabsContent value={period} className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main leaderboard */}
            <Card className="lg:col-span-2 overflow-hidden">
              <CardHeader className="px-6 py-5 border-b border-[#DFE1E6]">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Top Performers</CardTitle>
                  <span className="text-sm text-[#6B778C]">
                    Based on {period === "month" ? "monthly" : period === "quarter" ? "quarterly" : "yearly"} revenue
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <LeaderboardList leaderboard={filteredLeaderboard} />
                )}
              </CardContent>
            </Card>

            {/* Achievements and stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="px-6 py-5 border-b border-[#DFE1E6]">
                  <CardTitle className="text-lg">Your Performance</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <Skeleton className="h-28 w-full" />
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-lg font-bold mr-3">
                            8
                          </div>
                          <div>
                            <p className="font-medium">Your Rank</p>
                            <p className="text-sm text-[#6B778C]">Top 20%</p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          +2 spots
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Revenue</span>
                            <span className="font-medium">$243,450</span>
                          </div>
                          <div className="h-2 bg-[#DFE1E6] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0052CC]" style={{ width: "62%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Deals Closed</span>
                            <span className="font-medium">14 / 25</span>
                          </div>
                          <div className="h-2 bg-[#DFE1E6] rounded-full overflow-hidden">
                            <div className="h-full bg-[#36B37E]" style={{ width: "56%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>GP Target</span>
                            <span className="font-medium">73%</span>
                          </div>
                          <div className="h-2 bg-[#DFE1E6] rounded-full overflow-hidden">
                            <div className="h-full bg-[#FFAB00]" style={{ width: "73%" }}></div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="px-6 py-5 border-b border-[#DFE1E6]">
                  <CardTitle className="text-lg">Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AchievementCard
                        name="Fiber Expert"
                        description="Close 10 fiber deals this quarter"
                        icon="medal"
                        date="2 days ago"
                      />

                      <AchievementCard
                        name="Deal Closer"
                        description="Close 10 deals in a quarter"
                        icon="handshake"
                        date="Last week"
                      />

                      <AchievementCard
                        name="Sales Star"
                        description="Close more than $100,000 in deals in a month"
                        icon="trophy"
                        date="Last month"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Leaderboard;

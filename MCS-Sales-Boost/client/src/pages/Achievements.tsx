import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import AchievementGrid from "../components/achievements/AchievementGrid";
import AchievementBadge from "../components/achievements/AchievementBadge";

const Achievements = () => {
  const [category, setCategory] = useState("all");

  // Fetch achievements
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['/api/achievements'],
    queryFn: async () => {
      // This endpoint doesn't exist yet, so we'll simulate it
      return [
        {
          id: 1,
          name: "Sales Star",
          description: "Close more than $100,000 in deals in a single month",
          icon: "trophy",
          category: "sales",
          unlockedBy: 24,
          isUnlocked: true
        },
        {
          id: 2,
          name: "Deal Closer",
          description: "Close 10 deals in a quarter",
          icon: "handshake",
          category: "sales",
          unlockedBy: 18,
          isUnlocked: true
        },
        {
          id: 3,
          name: "Fiber Expert",
          description: "Close 10 fiber deals this quarter",
          icon: "medal",
          category: "product",
          unlockedBy: 12,
          isUnlocked: true
        },
        {
          id: 4,
          name: "Wireless Master",
          description: "Close 15 wireless deals in a quarter",
          icon: "wifi",
          category: "product",
          unlockedBy: 8,
          isUnlocked: false
        },
        {
          id: 5,
          name: "Top Performer",
          description: "Reach the top of the leaderboard",
          icon: "crown",
          category: "team",
          unlockedBy: 5,
          isUnlocked: false
        },
        {
          id: 6,
          name: "Team Player",
          description: "Help 5 team members close their deals",
          icon: "users",
          category: "team",
          unlockedBy: 14,
          isUnlocked: false
        },
        {
          id: 7,
          name: "Enterprise Champion",
          description: "Close 5 enterprise deals in a year",
          icon: "building",
          category: "sales",
          unlockedBy: 10,
          isUnlocked: false
        },
        {
          id: 8,
          name: "Carrier Connector",
          description: "Close 3 carrier deals in a quarter",
          icon: "link",
          category: "product",
          unlockedBy: 7,
          isUnlocked: false
        }
      ];
    }
  });

  // Filter achievements by category
  const filteredAchievements = achievements
    ? category === "all"
      ? achievements
      : achievements.filter((achievement: any) => achievement.category === category)
    : [];

  // Split into earned and unearned achievements
  const earnedAchievements = filteredAchievements.filter((achievement: any) => achievement.isUnlocked);
  const unearnedAchievements = filteredAchievements.filter((achievement: any) => !achievement.isUnlocked);

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 mt-12 lg:mt-0">
        <div>
          <h1 className="text-2xl font-display font-bold">Achievements</h1>
          <p className="text-[#6B778C] mt-1">Track your progress and earn rewards</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Tabs value={category} onValueChange={setCategory} className="w-[300px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="product">Product</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Achievement progress */}
      <Card className="mb-8">
        <CardHeader className="px-6 py-5 border-b border-[#DFE1E6]">
          <CardTitle className="text-lg">Your Achievement Progress</CardTitle>
          <CardDescription>You've earned 3 out of 8 available achievements</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-medium">
                    {earnedAchievements.length} / {filteredAchievements.length}
                  </span>
                </div>
                <div className="h-2.5 bg-[#DFE1E6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0052CC]"
                    style={{
                      width: `${filteredAchievements.length > 0
                        ? (earnedAchievements.length / filteredAchievements.length) * 100
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {earnedAchievements.slice(0, 3).map((achievement: any) => (
                  <AchievementBadge
                    key={achievement.id}
                    name={achievement.name}
                    icon={achievement.icon}
                    type="earned"
                  />
                ))}

                {earnedAchievements.length === 0 && (
                  <div className="w-full text-center py-4 text-[#6B778C]">
                    <p>No achievements earned yet in this category</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Earned achievements */}
      <Card className="mb-8">
        <CardHeader className="px-6 py-5 border-b border-[#DFE1E6]">
          <CardTitle className="text-lg">Earned Achievements</CardTitle>
          <CardDescription>Achievements you've already unlocked</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <AchievementGrid achievements={earnedAchievements} />
          )}
        </CardContent>
      </Card>

      {/* Available achievements */}
      <Card>
        <CardHeader className="px-6 py-5 border-b border-[#DFE1E6]">
          <CardTitle className="text-lg">Available Achievements</CardTitle>
          <CardDescription>Challenges you can complete to earn badges</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <AchievementGrid achievements={unearnedAchievements} />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Achievements;

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import {
  Award,
  Gift,
  Trophy,
  Star,
  Clock,
  Target,
  CheckCircle,
  ArrowRight,
  CheckSquare2,
  Layers,
  Coins
} from "lucide-react";

// Define types for our data
interface RewardsAndIncentivesData {
  userPoints: number;
  userRecentTransactions: PointTransaction[];
  availableRewards: Reward[];
  userAvailableRewards: Reward[];
  userRewards: UserReward[];
  activeChallenges: Challenge[];
  userChallenges: UserChallenge[];
  totalRewards: number;
  totalActiveChallenges: number;
  totalRedeemed: number;
  rewardsByCategory: Record<string, number>;
}

interface PointTransaction {
  id: number;
  userId: number;
  amount: number;
  description: string;
  transactionType: string;
  createdAt: string;
  referenceId: number | null;
  metadata: any;
}

interface Reward {
  id: number;
  name: string;
  description: string;
  type: string;
  category: string;
  pointCost: number;
  image: string | null;
  isAvailable: boolean | null;
  createdAt: string;
}

interface UserReward {
  id: number;
  userId: number;
  rewardId: number;
  status: string;
  awardedAt: string;
  redeemedAt: string | null;
  expiresAt: string | null;
  metadata: any;
}

interface Challenge {
  id: number;
  name: string;
  description: string;
  status: string;
  category: string;
  criteria: {
    minSales?: number;
    minRevenue?: number;
    targetRegion?: string;
    targetProduct?: string;
    type?: string;
    target?: number;
  };
  startDate: string;
  endDate: string;
  rewardPoints: number | null;
  createdAt: string;
}

interface ChallengeParticipant {
  id: number;
  userId: number;
  challengeId: number;
  status: string;
  joinedAt: string;
  progress: {
    currentSales?: number;
    currentRevenue?: number;
  } | null;
}

interface UserChallenge {
  challenge: Challenge;
  participant: ChallengeParticipant;
}

const RewardsAndIncentives = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Function to handle query errors
  const handleQueryError = (error: Error) => {
    console.error("Error fetching rewards data:", error);
    // If authentication error, show a toast
    if (error.message.includes('Authentication required')) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view rewards and incentives",
        variant: "destructive",
      });
    }
  };

  // Fetch rewards and incentives data from the API
  const { data, isLoading, error, refetch } = useQuery<RewardsAndIncentivesData>({
    queryKey: ['/api/rewards-and-incentives'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  // Handle redemption of rewards
  const handleRedeemReward = async (rewardId: number) => {
    try {
      const response = await apiRequest<{success: boolean; error?: string}>('POST', `/api/rewards/redeem/${rewardId}`);

      toast({
        title: "Reward Redeemed!",
        description: "You've successfully redeemed your reward",
        variant: "default",
      });

      // Refresh the data
      refetch();

    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while redeeming the reward",
        variant: "destructive",
      });
    }
  };

  // Handle joining a challenge
  const handleJoinChallenge = async (challengeId: number) => {
    try {
      const response = await apiRequest<{success: boolean; error?: string}>('POST', `/api/challenges/join/${challengeId}`);

      toast({
        title: "Challenge Joined!",
        description: "You've successfully joined the challenge",
        variant: "default",
      });

      // Refresh the data
      refetch();

    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while joining the challenge",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Rewards & Incentives</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Rewards & Incentives error:", error);

    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Rewards & Incentives</h1>
        <Card className="bg-destructive/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Error Loading Data</h3>
              <p className="text-sm text-muted-foreground mt-2">
                There was a problem loading the rewards and incentives data.
              </p>
              <p className="text-xs text-destructive mt-2">
                {errorMessage.includes('401') ? 'Authentication error. Please try logging out and logging back in.' : errorMessage}
              </p>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rewards & Incentives</h1>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          <span className="font-bold text-xl">{data?.userPoints || 0} Points</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="transactions">Points History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  Total Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.userPoints || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Available to redeem for rewards
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-blue-500" />
                  Active Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.activeChallenges?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Challenges you can participate in
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  Rewards Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.userRewards?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total rewards you've earned
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recently Earned Points */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Points Activity</CardTitle>
              <CardDescription>Your recent points transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.userRecentTransactions?.length > 0 ? (
                  data.userRecentTransactions.map((transaction: PointTransaction) => (
                    <div key={transaction.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {transaction.transactionType === 'reward' ? (
                          <Star className="h-5 w-5 text-yellow-500" />
                        ) : transaction.transactionType === 'redemption' ? (
                          <Gift className="h-5 w-5 text-purple-500" />
                        ) : (
                          <Coins className="h-5 w-5 text-blue-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${
                        transaction.transactionType === 'redemption' ? 'text-destructive' : 'text-green-500'
                      }`}>
                        {transaction.transactionType === 'redemption' ? '-' : '+'}{transaction.amount}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent transactions
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("transactions")}>
                View All Transactions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          {/* Available Challenges */}
          <Card>
            <CardHeader>
              <CardTitle>Active Challenges</CardTitle>
              <CardDescription>Ongoing challenges you can join</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.activeChallenges?.length > 0 ? (
                  data.activeChallenges.slice(0, 3).map((challenge: any) => (
                    <div key={challenge.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold flex items-center">
                            <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                            {challenge.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {challenge.description}
                          </p>
                        </div>
                        <Badge variant="secondary">{challenge.category}</Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-4">
                        <span>Ends: {new Date(challenge.endDate).toLocaleDateString()}</span>
                        <span>+{challenge.rewardPoints} points</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No active challenges
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("challenges")}>
                View All Challenges <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Rewards</CardTitle>
                <CardDescription>Rewards you can redeem with your points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data?.availableRewards?.length > 0 ? (
                    data.availableRewards.map((reward: any) => (
                      <Card key={reward.id} className="overflow-hidden">
                        <div className="bg-muted h-40 flex items-center justify-center">
                          {reward.image ? (
                            <img
                              src={reward.image}
                              alt={reward.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Gift className="h-16 w-16 text-muted-foreground/50" />
                          )}
                        </div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{reward.name}</CardTitle>
                            <Badge>{reward.type}</Badge>
                          </div>
                          <CardDescription>{reward.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span>{reward.pointCost} points</span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center pt-0">
                          <Badge variant="outline">{reward.category}</Badge>
                          <Button
                            size="sm"
                            disabled={data.userPoints < reward.pointCost}
                            onClick={() => handleRedeemReward(reward.id)}
                          >
                            {data.userPoints >= reward.pointCost ? "Redeem" : "Not Enough Points"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      No rewards available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Rewards</CardTitle>
                <CardDescription>Rewards you've earned</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.userRewards?.length > 0 ? (
                  <div className="space-y-4">
                    {data.userRewards.map((userReward: any) => {
                      const reward = data.availableRewards.find((r: any) => r.id === userReward.rewardId);
                      return (
                        <div key={userReward.id} className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {userReward.status === "redeemed" ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Clock className="h-5 w-5 text-amber-500" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{reward?.name || "Reward"}</h4>
                              <p className="text-xs text-muted-foreground">
                                {userReward.status === "pending" ? "Pending" : "Redeemed"} •
                                {" "}{new Date(userReward.awardedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant={userReward.status === "redeemed" ? "default" : "outline"}>
                            {userReward.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    You haven't earned any rewards yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Challenges</CardTitle>
              <CardDescription>Current challenges you can participate in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.activeChallenges?.length > 0 ? (
                  data.activeChallenges.map((challenge: any) => {
                    // Check if user is already participating
                    const isParticipating = data.userChallenges?.some(
                      (uc: any) => uc.challenge.id === challenge.id
                    );
                    const userChallenge = data.userChallenges?.find(
                      (uc: any) => uc.challenge.id === challenge.id
                    );

                    return (
                      <div key={challenge.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-yellow-500" />
                              {challenge.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {challenge.description}
                            </p>
                          </div>
                          <Badge variant={isParticipating ? "default" : "outline"}>
                            {isParticipating ? "Participating" : "Join"}
                          </Badge>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {challenge.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins className="h-4 w-4 text-yellow-500" />
                              {challenge.rewardPoints} points
                            </span>
                          </div>

                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              Ends: {new Date(challenge.endDate).toLocaleDateString()}
                            </span>
                          </div>

                          {isParticipating && userChallenge && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                {userChallenge.participant.progress && (
                                  <span>
                                    {userChallenge.participant.progress.currentSales} /
                                    {challenge.criteria.minSales}
                                  </span>
                                )}
                              </div>
                              <Progress
                                value={
                                  userChallenge.participant.progress ?
                                  (userChallenge.participant.progress.currentSales / challenge.criteria.minSales) * 100 :
                                  0
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex justify-end">
                          {!isParticipating ? (
                            <Button size="sm" onClick={() => handleJoinChallenge(challenge.id)}>
                              Join Challenge
                            </Button>
                          ) : (
                            <Badge variant="outline" className="px-3 py-1">
                              {userChallenge.participant.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No active challenges available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Challenges</CardTitle>
              <CardDescription>Challenges you're participating in</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.userChallenges?.length > 0 ? (
                <div className="space-y-4">
                  {data.userChallenges.map((userChallenge: any) => (
                    <div key={userChallenge.participant.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {userChallenge.participant.status === "completed" ? (
                              <CheckSquare2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Layers className="h-4 w-4 text-blue-500" />
                            )}
                            {userChallenge.challenge.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined on {new Date(userChallenge.participant.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge>
                          {userChallenge.participant.status}
                        </Badge>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          {userChallenge.participant.progress && (
                            <span>
                              {userChallenge.participant.progress.currentSales} /
                              {userChallenge.challenge.criteria.minSales}
                            </span>
                          )}
                        </div>
                        <Progress
                          value={
                            userChallenge.participant.progress ?
                            (userChallenge.participant.progress.currentSales / userChallenge.challenge.criteria.minSales) * 100 :
                            0
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  You haven't joined any challenges yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Points History</CardTitle>
              <CardDescription>Your point transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.userRecentTransactions?.length > 0 ? (
                  data.userRecentTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex justify-between items-center border-b pb-4">
                      <div className="flex items-center gap-3">
                        {transaction.transactionType === 'reward' ? (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Award className="h-5 w-5 text-blue-500" />
                          </div>
                        ) : transaction.transactionType === 'redemption' ? (
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Gift className="h-5 w-5 text-purple-500" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Coins className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()} •
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold text-lg ${
                        transaction.transactionType === 'redemption' ? 'text-destructive' : 'text-green-500'
                      }`}>
                        {transaction.transactionType === 'redemption' ? '-' : '+'}{transaction.amount}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RewardsAndIncentives;

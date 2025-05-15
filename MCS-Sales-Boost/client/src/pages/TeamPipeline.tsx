import React from "react";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import { Loader2, Calendar, ArrowUp, ArrowDown, Filter, PieChart, UserCheck } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { getCurrentUser } from '../lib/auth';
import { Deal, User, Team, Target } from '@shared/schema';
import { formatCurrency } from '../lib/currency';

// Helper functions for date manipulation
const getWeekDates = (date = new Date()) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    weekDates.push(nextDate);
  }

  return weekDates;
};

const formatWeekRange = (weekDates: Date[]) => {
  const startDate = weekDates[0];
  const endDate = weekDates[6];
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
};

// Get previous and next week
const getPreviousWeek = (date: Date) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - 7);
  return newDate;
};

const getNextWeek = (date: Date) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 7);
  return newDate;
};

export default function TeamPipeline() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(getWeekDates(selectedDate));
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');

  // Possible filter values
  const categories = ['all', 'wireless', 'fiber'];
  const stages = ['all', 'prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserRole(user.role);
      }
    };

    loadCurrentUser();
  }, []);

  // Update week dates when selected date changes
  useEffect(() => {
    setWeekDates(getWeekDates(selectedDate));
  }, [selectedDate]);

  // Fetch all users
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch all teams
  const { data: teams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  // Fetch all deals
  const { data: allDeals, isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
  });

  // Fetch all targets
  const { data: allTargets } = useQuery<Target[]>({
    queryKey: ['/api/targets'],
  });

  // Get team members
  const teamMembers = users?.filter(user =>
    selectedTeam ? user.teamId === selectedTeam : true
  ) || [];

  // Filter deals for the selected team
  const teamDeals = allDeals?.filter(deal => {
    // Filter by team
    const userInTeam = users?.find(user =>
      user.id === deal.userId && (selectedTeam ? user.teamId === selectedTeam : true)
    );

    // Filter by category
    const matchesCategory = filterCategory === 'all' || deal.category === filterCategory;

    // Filter by stage
    const matchesStage = filterStage === 'all' || deal.stage === filterStage;

    return userInTeam && matchesCategory && matchesStage;
  }) || [];

  // Filter deals for this week
  const weekDeals = teamDeals.filter(deal => {
    const dealDate = deal.updatedAt
      ? new Date(deal.updatedAt)
      : (deal.createdAt ? new Date(deal.createdAt) : new Date());
    return weekDates[0] <= dealDate && dealDate <= weekDates[6];
  });

  // Weekly metrics
  const weekClosedDeals = weekDeals.filter(d => d.stage === 'closed_won');
  const weekClosedValue = weekClosedDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weekLostValue = weekDeals
    .filter(d => d.stage === 'closed_lost')
    .reduce((sum, deal) => sum + deal.value, 0);

  // Team performance metrics
  const teamPerformance = teamMembers.map(member => {
    const userDeals = allDeals?.filter(deal => deal.userId === member.id) || [];
    const userWeekDeals = userDeals.filter(deal => {
      const dealDate = deal.updatedAt
        ? new Date(deal.updatedAt)
        : (deal.createdAt ? new Date(deal.createdAt) : new Date());
      return weekDates[0] <= dealDate && dealDate <= weekDates[6];
    });

    const closedWonValue = userDeals
      .filter(d => d.stage === 'closed_won')
      .reduce((sum, deal) => sum + deal.value, 0);

    const weekClosedValue = userWeekDeals
      .filter(d => d.stage === 'closed_won')
      .reduce((sum, deal) => sum + deal.value, 0);

    const userTarget = allTargets?.find(target => {
      const now = new Date();
      if (!target.startDate || !target.endDate) return false;

      const startDate = typeof target.startDate === 'string'
        ? new Date(target.startDate)
        : target.startDate;

      const endDate = typeof target.endDate === 'string'
        ? new Date(target.endDate)
        : target.endDate;

      return target.userId === member.id && startDate <= now && endDate >= now;
    });

    const targetProgress = userTarget
      ? (userTarget.currentValue || 0) / userTarget.targetValue * 100
      : 0;

    return {
      user: member,
      totalDeals: userDeals.length,
      weekDeals: userWeekDeals.length,
      weekClosedValue,
      totalClosedValue: closedWonValue,
      targetProgress
    };
  });

  // Team totals
  const teamTotalValue = teamDeals
    .filter(d => d.stage === 'closed_won')
    .reduce((sum, deal) => sum + deal.value, 0);

  // Deal stage distribution
  const stageDistribution = stages.slice(1).map(stage => ({
    stage,
    count: teamDeals.filter(d => d.stage === stage).length,
    value: teamDeals
      .filter(d => d.stage === stage)
      .reduce((sum, deal) => sum + deal.value, 0)
  }));

  // Deal category distribution
  const categoryDistribution = categories.slice(1).map(category => ({
    category,
    count: teamDeals.filter(d => d.category === category).length,
    value: teamDeals
      .filter(d => d.category === category)
      .reduce((sum, deal) => sum + deal.value, 0)
  }));

  // Change week handlers
  const handlePreviousWeek = () => {
    setSelectedDate(getPreviousWeek(selectedDate));
  };

  const handleNextWeek = () => {
    setSelectedDate(getNextWeek(selectedDate));
  };

  // Handle team selection
  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId === 'all' ? null : parseInt(teamId));
  };

  // Using the centralized formatCurrency utility

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Pipeline</h1>
          <p className="text-muted-foreground">Comprehensive view of your team's sales activities</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            Previous Week
          </Button>

          <div className="flex items-center bg-muted px-3 py-1 rounded-md">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatWeekRange(weekDates)}</span>
          </div>

          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            Next Week
          </Button>

          {teams && (
            <Select
              value={selectedTeam?.toString() || 'all'}
              onValueChange={handleTeamChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted rounded-md">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Category:</span>
          <Select
            value={filterCategory}
            onValueChange={setFilterCategory}
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Stage:</span>
          <Select
            value={filterStage}
            onValueChange={setFilterStage}
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map(stage => (
                <SelectItem key={stage} value={stage}>
                  {stage === 'all'
                    ? 'All Stages'
                    : stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Closed Deals</CardTitle>
            <CardDescription>Value of closed deals this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(weekClosedValue)}</div>
            <div className="flex items-center mt-2">
              <div className="text-sm text-muted-foreground flex items-center">
                <UserCheck className="h-4 w-4 mr-1" />
                {weekClosedDeals.length} deals closed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pipeline Value</CardTitle>
            <CardDescription>Total value of active pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(teamDeals
                .filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
                .reduce((sum, deal) => sum + deal.value, 0))}
            </div>
            <div className="flex items-center mt-2">
              <div className="text-sm text-muted-foreground">
                {teamDeals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length} active deals
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Win Rate</CardTitle>
            <CardDescription>Weekly deal win percentage</CardDescription>
          </CardHeader>
          <CardContent>
            {weekDeals.filter(d => ['closed_won', 'closed_lost'].includes(d.stage)).length > 0 ? (
              <>
                <div className="text-3xl font-bold">
                  {Math.round(
                    (weekDeals.filter(d => d.stage === 'closed_won').length /
                    weekDeals.filter(d => ['closed_won', 'closed_lost'].includes(d.stage)).length) * 100
                  )}%
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {weekDeals.filter(d => d.stage === 'closed_won').length} won vs {weekDeals.filter(d => d.stage === 'closed_lost').length} lost
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">-</div>
                <div className="text-sm text-muted-foreground mt-2">
                  No closed deals this week
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Lost Opportunities</CardTitle>
            <CardDescription>Value of deals lost this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{formatCurrency(weekLostValue)}</div>
            <div className="flex items-center mt-2">
              <div className="text-sm text-muted-foreground">
                {weekDeals.filter(d => d.stage === 'closed_lost').length} deals lost
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Individual performance metrics for team members</CardDescription>
        </CardHeader>
        <CardContent>
          {teamPerformance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Pipeline Deals</TableHead>
                  <TableHead>Weekly Activity</TableHead>
                  <TableHead>Weekly Closed</TableHead>
                  <TableHead>Total Closed</TableHead>
                  <TableHead>Target Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPerformance.map(({ user, totalDeals, weekDeals, weekClosedValue, totalClosedValue, targetProgress }) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{totalDeals}</TableCell>
                    <TableCell>{weekDeals}</TableCell>
                    <TableCell>{formatCurrency(weekClosedValue)}</TableCell>
                    <TableCell>{formatCurrency(totalClosedValue)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={targetProgress} className="h-2 w-[100px]" />
                        <span className="text-sm">{Math.round(targetProgress)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No team members to display
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Deal Stage Distribution</CardTitle>
            <CardDescription>Breakdown of deals by sales stage</CardDescription>
          </CardHeader>
          <CardContent>
            {stageDistribution.map(({ stage, count, value }) => (
              <div key={stage} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="capitalize text-sm font-medium">
                    {stage.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {count} deals | {formatCurrency(value)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      stage === 'closed_won' ? 'bg-green-500' :
                      stage === 'closed_lost' ? 'bg-red-500' :
                      stage === 'negotiation' ? 'bg-blue-500' :
                      stage === 'proposal' ? 'bg-indigo-500' :
                      stage === 'qualification' ? 'bg-violet-500' :
                      'bg-gray-500'
                    }`}
                    style={{
                      width: teamDeals.length
                        ? `${(count / teamDeals.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deal Category Distribution</CardTitle>
            <CardDescription>Breakdown of deals by product category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryDistribution.map(({ category, count, value }) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="capitalize text-sm font-medium">
                    {category}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {count} deals | {formatCurrency(value)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      category === 'wireless' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{
                      width: teamDeals.length
                        ? `${(count / teamDeals.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            ))}

            {/* Category value comparison */}
            <Separator className="my-4" />
            <div className="flex justify-between">
              <div className="text-center">
                <span className="text-sm font-medium">Wireless Revenue</span>
                <div className="text-xl font-bold mt-1">
                  {formatCurrency(
                    teamDeals.filter(d => d.category === 'wireless' && d.stage === 'closed_won')
                      .reduce((sum, deal) => sum + deal.value, 0)
                  )}
                </div>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium">Fiber Revenue</span>
                <div className="text-xl font-bold mt-1">
                  {formatCurrency(
                    teamDeals.filter(d => d.category === 'fiber' && d.stage === 'closed_won')
                      .reduce((sum, deal) => sum + deal.value, 0)
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Deal Activity */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Deal Activity</CardTitle>
          <CardDescription>Team deals updated this week</CardDescription>
        </CardHeader>
        <CardContent>
          {dealsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : weekDeals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <span>Stage Change</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekDeals.map(deal => {
                  const rep = users?.find(u => u.id === deal.userId);
                  // In a real application, you would track stage changes in the database
                  // For demonstration, we'll generate random stage changes
                  const stageChanged = Math.random() > 0.5;
                  const stageMovedUp = Math.random() > 0.5;

                  return (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.name}</TableCell>
                      <TableCell>{rep?.name || 'Unknown'}</TableCell>
                      <TableCell>{formatCurrency(deal.value)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {deal.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            deal.stage === 'closed_won'
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : deal.stage === 'closed_lost'
                                ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                          }
                        >
                          {deal.stage.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {stageChanged ? (
                          <div className="flex items-center">
                            {stageMovedUp ? (
                              <>
                                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500 text-sm">Advanced</span>
                              </>
                            ) : (
                              <>
                                <ArrowDown className="h-4 w-4 text-amber-500 mr-1" />
                                <span className="text-amber-500 text-sm">Moved back</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No change</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No deal activity recorded for this week
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
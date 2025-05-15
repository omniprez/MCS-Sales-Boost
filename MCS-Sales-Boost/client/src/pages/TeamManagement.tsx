import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import TeamCard from "../components/team/TeamCard";
import TeamMemberCard from "../components/team/TeamMemberCard";
import NewTeamMemberDialog from "../components/team/NewTeamMemberDialog";

const TeamManagement = () => {
  const [teamView, setTeamView] = useState("internal");
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [newMemberDialogOpen, setNewMemberDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch teams
  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      // This endpoint doesn't exist yet, so we'll simulate it
      return [
        { id: 1, name: "Internal Sales Team", type: "internal", region: "National", memberCount: 12 },
        { id: 2, name: "Enterprise Solutions", type: "internal", region: "West", memberCount: 8 },
        { id: 3, name: "SMB Sales", type: "internal", region: "East", memberCount: 6 },
        { id: 4, name: "Channel Partners", type: "channel_partner", region: "National", memberCount: 15 },
        { id: 5, name: "Regional Resellers", type: "channel_partner", region: "South", memberCount: 9 },
      ];
    }
  });

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  // Filter teams based on type
  const filteredTeams = teams
    ? teams.filter(team =>
        team.type === (teamView === "internal" ? "internal" : "channel_partner") &&
        (regionFilter === "all" || team.region.includes(regionFilter))
      )
    : [];

  // Filter users based on team type and search term
  const filteredUsers = users
    ? users.filter((user: any) => {
        const matchesTeamType = teamView === "internal" ? !user.isChannelPartner : user.isChannelPartner;
        const matchesSearch = !searchTerm ||
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTeamType && matchesSearch;
      })
    : [];

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8 max-w-[1920px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 mt-12 lg:mt-0">
        <div>
          <h1 className="text-2xl font-display font-bold">Team Management</h1>
          <p className="text-[#6B778C] mt-1">Manage your sales teams and channel partners</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center">
          <Button onClick={() => setNewMemberDialogOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Team Member</span>
          </Button>
        </div>
      </div>

      {/* Team tabs */}
      <Tabs value={teamView} onValueChange={setTeamView} className="mb-6">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="internal">Internal Sales Teams</TabsTrigger>
          <TabsTrigger value="channel">Channel Partners</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        <div className="flex space-x-3">
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="National">National</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto">
          <Input
            type="search"
            placeholder="Search team members..."
            className="w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Teams grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {isLoadingTeams ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : (
          filteredTeams.map(team => (
            <TeamCard
              key={team.id}
              id={team.id}
              name={team.name}
              region={team.region}
              memberCount={team.memberCount}
              type={team.type}
            />
          ))
        )}
      </div>

      {/* Team members */}
      <Card>
        <CardHeader className="px-6 py-5 border-b border-[#DFE1E6]">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              {teamView === "internal" ? "Internal Team Members" : "Channel Partner Representatives"}
            </CardTitle>
            <span className="text-sm text-[#6B778C]">
              {filteredUsers?.length || 0} members
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingUsers ? (
              [...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))
            ) : (
              filteredUsers.map((user: any) => (
                <TeamMemberCard
                  key={user.id}
                  id={user.id}
                  name={user.name}
                  role={user.role}
                  avatar={user.avatar}
                  email={user.email}
                  teamId={user.teamId}
                />
              ))
            )}

            {filteredUsers && filteredUsers.length === 0 && (
              <div className="col-span-3 text-center py-8 text-[#6B778C]">
                <p>No team members found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Team Member Dialog */}
      <NewTeamMemberDialog
        open={newMemberDialogOpen}
        onOpenChange={setNewMemberDialogOpen}
        onMemberCreated={() => {
          // Refresh data after creating a team member
          queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        }}
      />
    </div>
  );
};

export default TeamManagement;

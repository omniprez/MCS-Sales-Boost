import React from "react";
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { queryClient, apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import {
  User, Team, InsertUser, InsertTeam, InsertTarget, Target
} from '@shared/schema';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, Plus, Edit, Trash2, ArrowUpDown, FileSpreadsheet, Upload, CheckCircle2, RefreshCw, UserPlus, Link } from "lucide-react";
import BulkUploadAccounts from '../components/admin/BulkUploadAccounts';
// CSV functionality removed

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sales-reps');

  // Function to fix deal stages
  const fixDealStages = async () => {
    try {
      const response = await apiRequest('POST', '/api/fix-deal-stages');

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || `Fixed ${response.fixedCount} deals with invalid stages`,
        });

        // Refresh all relevant data
        queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
        queryClient.invalidateQueries({ queryKey: ['pipeline'] });
        queryClient.invalidateQueries({ queryKey: ['/api/ dashboard'] });

        // Force a page reload to ensure all components refresh
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fix deal stages",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fixing deal stages:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Function to add sample deals
  const addSampleDeals = async () => {
    try {
      toast({
        title: "Adding Sample Deals",
        description: "Creating sample deals in the database...",
      });

      const response = await apiRequest('POST', '/api/add-sample-deals');

      if (response.success) {
        toast({
          title: "Success",
          description: `Added ${response.dealsCount} sample deals to the database`,
        });

        // Refresh all relevant data
        queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
        queryClient.invalidateQueries({ queryKey: ['pipeline'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });

        // Force a page reload to ensure all components refresh
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add sample deals",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding sample deals:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Function to reset pipeline stages
  const resetPipelineStages = async () => {
    try {
      toast({
        title: "Resetting Pipeline Stages",
        description: "Updating deal stages to ensure proper distribution...",
      });

      const response = await apiRequest('POST', '/api/reset-pipeline-stages');

      if (response.success) {
        toast({
          title: "Success",
          description: `Reset ${response.updatedCount} deals to proper pipeline stages`,
        });

        // Clear any cached pipeline data
        localStorage.removeItem('salesSpark_pipelineData');

        // Refresh all relevant data
        queryClient.invalidateQueries();

        // No need to force a page reload, the invalidated queries will refresh the components
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to reset pipeline stages",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error resetting pipeline stages:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Function to add a sample sales rep
  const addSampleSalesRep = async () => {
    try {
      toast({
        title: "Adding Sample Sales Rep",
        description: "Creating a sample sales representative...",
      });

      const response = await apiRequest('POST', '/api/add-sample-sales-rep');

      if (response.success) {
        toast({
          title: "Success",
          description: `Added sample sales rep: ${response.name}`,
        });

        // Refresh all relevant data
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/leaderboard'] });

        // No need to force a page reload, the invalidated queries will refresh the components
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add sample sales rep",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding sample sales rep:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Function to assign deals to sales reps
  const assignDealsToReps = async () => {
    try {
      toast({
        title: "Assigning Deals to Sales Reps",
        description: "Assigning deals to existing sales representatives...",
      });

      const response = await apiRequest('POST', '/api/assign-deals-to-reps');

      if (response.success) {
        toast({
          title: "Success",
          description: `Assigned ${response.assignedCount} deals to ${response.repsCount} sales reps`,
        });

        // Refresh all relevant data
        queryClient.invalidateQueries();

        // No need to force a page reload, the invalidated queries will refresh the components
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to assign deals to sales reps",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning deals to sales reps:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Function to clean up test data
  const cleanupTestData = async () => {
    try {
      // Show confirmation dialog
      if (!window.confirm('This will permanently delete all test data (users, customers, and deals). Are you sure?')) {
        return;
      }

      const response = await apiRequest('DELETE', '/api/cleanup-test-data');

      if (response.success) {
        toast({
          title: "Success",
          description: `Test data cleanup complete. Deleted: ${response.stats.deletedDeals} deals, ${response.stats.deletedCustomers} customers, ${response.stats.deletedUsers} users.`,
        });

        // Clear local storage cache
        localStorage.removeItem('salesSpark_pipelineData');

        // Refresh all relevant data
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
        queryClient.invalidateQueries({ queryKey: ['pipeline'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/quota-completion'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/pipeline-summary'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/sales-leader'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/leaderboard'] });

        // No need to force a page reload, the invalidated queries will refresh the components
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to clean up test data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <BulkUploadAccounts />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="sales-reps" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="sales-reps">Sales Representatives</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="targets">Sales Targets</TabsTrigger>
        </TabsList>

        <TabsContent value="sales-reps">
          <SalesRepSection />
        </TabsContent>

        <TabsContent value="teams">
          <TeamsSection />
        </TabsContent>

        <TabsContent value="targets">
          <TargetsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sales Representatives Section
function SalesRepSection() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'sales_rep',
    teamId: null as number | null,
    isChannelPartner: false,
    avatar: ''
  });

  const { toast } = useToast();

  // Fetch users data
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      console.log('Fetching users data');
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      console.log('Fetched users data:', data);
      return data;
    },
    staleTime: 0, // Always refetch
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Refetch data when component mounts
  useEffect(() => {
    refetchUsers();
  }, []);

  // Fetch teams for dropdown
  const { data: teams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  // Create/update user mutation
  const mutation = useMutation({
    mutationFn: async (userData: Partial<InsertUser> & { id?: number }) => {
      const { id, ...restData } = userData;
      console.log('Mutation function called with data:', userData);

      try {
        if (id) {
          // Update existing user
          console.log(`Updating user with ID ${id}`);

          try {
            const response = await fetch(`/api/users/${id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(restData),
            });

            // Check if the response is ok
            if (!response.ok) {
              // Try to parse the error message
              try {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
              } catch (parseError) {
                // If we can't parse the JSON, use the status text
                throw new Error(`Failed to update user: ${response.statusText}`);
              }
            }

            // Try to parse the response
            try {
              const data = await response.json();
              console.log('Update response data:', data);
              return data;
            } catch (parseError) {
              console.error('Error parsing response:', parseError);
              // If we can't parse the JSON but the response was ok, return a success object
              return { id, ...restData, success: true };
            }
          } catch (error) {
            console.error('Error in update request:', error);
            throw error;
          }
        } else {
          // Create new user
          console.log('Creating new user');
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(restData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create user');
          }

          const result = await response.json();
          console.log('User created successfully:', result);
          return result;
        }
      } catch (error) {
        console.error('Error in mutation function:', error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log('Mutation succeeded with data:', data);

      // Invalidate all relevant queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });

      // Force refetch the users data
      await refetchUsers();

      // Add a small delay to ensure the UI updates
      setTimeout(async () => {
        await refetchUsers();
        console.log('Refetched users data after timeout');
      }, 500);

      toast({
        title: `${editingUser ? 'Updated' : 'Created'} sales representative`,
        description: `Successfully ${editingUser ? 'updated' : 'created'} sales representative.`,
      });

      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${editingUser ? 'update' : 'create'} sales representative`,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      console.log(`Deleting user with ID ${userId}`);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      return await response.json();
    },
    onSuccess: async (data) => {
      console.log('Delete mutation succeeded with data:', data);

      // Invalidate all relevant queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });

      // Force refetch the users data
      await refetchUsers();

      // Add a small delay to ensure the UI updates
      setTimeout(async () => {
        await refetchUsers();
        console.log('Refetched users data after timeout');
      }, 500);

      toast({
        title: 'Deleted sales representative',
        description: 'Successfully deleted sales representative.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete sales representative',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleOpenDialog = (user?: User) => {
    console.log("Opening dialog", user ? "for editing user" : "for new user");

    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '', // Don't show existing password
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
        isChannelPartner: user.isChannelPartner || false,
        avatar: user.avatar || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'sales_rep',
        teamId: null,
        isChannelPartner: false,
        avatar: ''
      });
    }

    // Use setTimeout to ensure this runs after any other events in the queue
    setTimeout(() => {
      setOpenDialog(true);
      console.log("Dialog opened, state set to true");
    }, 0);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'teamId') {
      setFormData(prev => ({
        ...prev,
        [name]: value && value !== 'none' ? parseInt(value) : null
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Form submitted", formData);

    // Check if username already exists (for new users)
    if (!editingUser && users) {
      const existingUser = users.find(user => user.username.toLowerCase() === formData.username.toLowerCase());
      if (existingUser) {
        toast({
          title: "Username already exists",
          description: "Please choose a different username",
          variant: "destructive",
        });
        return;
      }
    }

    const userData = {
      ...formData,
      ...(editingUser && { id: editingUser.id }),
    };

    console.log("Submitting user data:", userData);

    // Only include password if it's set (for updates)
    if (!userData.password && editingUser) {
      const { password, ...restData } = userData;
      console.log("Mutating without password:", restData);
      mutation.mutate(restData);
    } else {
      console.log("Mutating with full data");
      mutation.mutate(userData);
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this sales representative?')) {
      deleteMutation.mutate(userId);
    }
  };

  const getTeamName = (teamId: number | null) => {
    if (!teamId || !teams) return 'No Team';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sales Representatives</CardTitle>
          <CardDescription>Manage your sales team and representatives</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              refetchUsers();
            }}
            type="button"
            variant="outline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg> Refresh
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenDialog();
              return false;
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Sales Rep
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {usersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role === 'admin'
                        ? 'Administrator'
                        : user.role === 'manager'
                          ? 'Manager'
                          : 'Sales Rep'}
                    </TableCell>
                    <TableCell>{getTeamName(user.teamId)}</TableCell>
                    <TableCell>
                      {user.isChannelPartner ? 'Channel Partner' : 'Internal'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No sales representatives found
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-2 text-xs text-gray-500">
                      Debug info: {users ? `Users array is empty (length: ${users.length})` : 'Users is null or undefined'}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        )}

        <Dialog
          open={openDialog}
          onOpenChange={(open) => {
            console.log("Dialog onOpenChange called with:", open);
            if (!open) {
              handleCloseDialog();
            }
          }}
        >
          <DialogContent
            className="sm:max-w-[500px]"
            onClick={(e) => e.stopPropagation()}
            onPointerDownOutside={(e) => {
              e.preventDefault();
              console.log("Preventing pointer down outside");
            }}
          >
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit' : 'Add'} Sales Representative</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Update the information for this sales representative.'
                  : 'Add a new sales representative to your team.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e);
            }} onClick={(e) => e.stopPropagation()}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required={!editingUser}
                    placeholder={editingUser ? '(unchanged)' : ''}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select
                    name="role"
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange('role', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="sales_rep">Sales Representative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teamId" className="text-right">
                    Team
                  </Label>
                  <Select
                    name="teamId"
                    value={formData.teamId?.toString() || 'none'}
                    onValueChange={(value) => handleSelectChange('teamId', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Team</SelectItem>
                      {teams?.map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isChannelPartner" className="text-right">
                    Type
                  </Label>
                  <Select
                    name="isChannelPartner"
                    value={formData.isChannelPartner ? 'true' : 'false'}
                    onValueChange={(value) => handleSelectChange('isChannelPartner', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Internal</SelectItem>
                      <SelectItem value="true">Channel Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="avatar" className="text-right">
                    Avatar URL
                  </Label>
                  <Input
                    id="avatar"
                    name="avatar"
                    value={formData.avatar || ''}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="(optional)"
                  />
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <div>
                  {editingUser && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        handleCloseDialog();
                        handleDeleteUser(editingUser.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete User
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCloseDialog();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={mutation.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit(e as unknown as React.FormEvent);
                    }}
                  >
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingUser ? 'Update' : 'Add'} Rep
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Teams Section
function TeamsSection() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    type: 'internal'
  });

  const { toast } = useToast();

  // Fetch teams data
  const { data: teams, isLoading: teamsLoading, refetch: refetchTeams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      console.log('Fetching teams data');
      const response = await fetch('/api/teams', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      console.log('Fetched teams data:', data);
      return data;
    },
    staleTime: 0, // Always refetch
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Refetch data when component mounts
  useEffect(() => {
    refetchTeams();
  }, []);

  // Create/update team mutation
  const mutation = useMutation({
    mutationFn: async (teamData: Partial<InsertTeam> & { id?: number }) => {
      const { id, ...restData } = teamData;
      console.log('Team mutation function called with data:', teamData);

      try {
        if (id) {
          // Update existing team
          console.log(`Updating team with ID ${id}`);
          const response = await fetch(`/api/teams/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(restData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update team');
          }

          return await response.json();
        } else {
          // Create new team
          console.log('Creating new team');
          const response = await fetch('/api/teams', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(restData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create team');
          }

          const result = await response.json();
          console.log('Team created successfully:', result);
          return result;
        }
      } catch (error) {
        console.error('Error in team mutation function:', error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log('Team mutation succeeded with data:', data);

      // Invalidate all relevant queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      await queryClient.invalidateQueries({ queryKey: ['teams'] });

      // Force refetch the teams data
      await refetchTeams();

      // Add a small delay to ensure the UI updates
      setTimeout(async () => {
        await refetchTeams();
        console.log('Refetched teams data after timeout');
      }, 500);

      toast({
        title: `${editingTeam ? 'Updated' : 'Created'} team`,
        description: `Successfully ${editingTeam ? 'updated' : 'created'} team.`,
      });

      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${editingTeam ? 'update' : 'create'} team`,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete team mutation
  const deleteMutation = useMutation({
    mutationFn: async (teamId: number) => {
      console.log(`Deleting team with ID ${teamId}`);
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete team');
      }

      return await response.json();
    },
    onSuccess: async (data) => {
      console.log('Delete team mutation succeeded with data:', data);

      // Invalidate all relevant queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      await queryClient.invalidateQueries({ queryKey: ['teams'] });

      // Force refetch the teams data
      await refetchTeams();

      // Add a small delay to ensure the UI updates
      setTimeout(async () => {
        await refetchTeams();
        console.log('Refetched teams data after timeout');
      }, 500);

      toast({
        title: 'Deleted team',
        description: 'Successfully deleted team.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete team',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleOpenDialog = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        region: team.region || '',
        type: team.type
      });
    } else {
      setEditingTeam(null);
      setFormData({
        name: '',
        region: '',
        type: 'internal'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTeam(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teamData = {
      ...formData,
      ...(editingTeam && { id: editingTeam.id }),
    };
    mutation.mutate(teamData);
  };

  const handleDeleteTeam = (teamId: number) => {
    if (confirm('Are you sure you want to delete this team?')) {
      deleteMutation.mutate(teamId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Teams</CardTitle>
          <CardDescription>Manage your sales teams and regional divisions</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              refetchTeams();
            }}
            type="button"
            variant="outline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg> Refresh
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Team
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {teamsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams && teams.length > 0 ? (
                teams.map(team => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.region || 'Global'}</TableCell>
                    <TableCell>
                      {team.type === 'internal' ? 'Internal' : 'Channel Partner'}
                    </TableCell>
                    <TableCell>
                      {team.createdAt
                        ? new Date(team.createdAt).toLocaleDateString()
                        : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(team)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No teams found
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-2 text-xs text-gray-500">
                      Debug info: {teams ? `Teams array is empty (length: ${teams.length})` : 'Teams is null or undefined'}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[500px]" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>{editingTeam ? 'Edit' : 'Add'} Team</DialogTitle>
              <DialogDescription>
                {editingTeam
                  ? 'Update the information for this team.'
                  : 'Add a new sales team to your organization.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Team Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="region" className="text-right">
                    Region
                  </Label>
                  <Input
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="(optional)"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Team Type
                  </Label>
                  <Select
                    name="type"
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select team type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="channel_partner">Channel Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTeam ? 'Update' : 'Add'} Team
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Sales Targets Section
function TargetsSection() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [formData, setFormData] = useState({
    userId: 0,
    targetType: 'revenue',
    period: 'monthly',
    startDate: '',
    endDate: '',
    targetValue: 0,
    currentValue: 0
  });

  const { toast } = useToast();

  // Fetch targets data
  const { data: targets, isLoading: targetsLoading, refetch: refetchTargets } = useQuery<Target[]>({
    queryKey: ['/api/targets'],
    queryFn: async () => {
      console.log('Fetching targets data');
      try {
        const response = await fetch('/api/targets', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch targets');
        }
        const data = await response.json();
        console.log('Fetched targets data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching targets:', error);
        throw error;
      }
    },
    staleTime: 0, // Always refetch
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Refetch data when component mounts
  useEffect(() => {
    refetchTargets();
  }, []);

  // Fetch users for dropdown
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Create/update target mutation
  const mutation = useMutation({
    mutationFn: async (targetData: Partial<InsertTarget> & { id?: number }) => {
      const { id, ...restData } = targetData;
      console.log('Target mutation function called with data:', targetData);

      try {
        if (id) {
          // Update existing target
          console.log(`Updating target with ID ${id}`);
          const response = await fetch(`/api/targets/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(restData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update target');
          }

          const result = await response.json();
          console.log('Target updated successfully:', result);
          return result;
        } else {
          // Create new target
          console.log('Creating new target');
          const response = await fetch('/api/targets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(restData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create target');
          }

          const result = await response.json();
          console.log('Target created successfully:', result);
          return result;
        }
      } catch (error) {
        console.error('Error in target mutation:', error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log('Target mutation succeeded with data:', data);

      // Invalidate all relevant queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/targets'] });

      // Force refetch the targets data
      await refetchTargets();

      // Add a small delay to ensure the UI updates
      setTimeout(async () => {
        await refetchTargets();
        console.log('Refetched targets data after timeout');
      }, 500);

      toast({
        title: `${editingTarget ? 'Updated' : 'Created'} sales target`,
        description: `Successfully ${editingTarget ? 'updated' : 'created'} sales target.`,
      });

      handleCloseDialog();
    },
    onError: (error: Error) => {
      console.error('Target mutation error:', error);
      toast({
        title: `Failed to ${editingTarget ? 'update' : 'create'} sales target`,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete target mutation
  const deleteMutation = useMutation({
    mutationFn: async (targetId: number) => {
      console.log(`Deleting target with ID ${targetId}`);
      const response = await fetch(`/api/targets/${targetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete target');
      }

      return await response.json();
    },
    onSuccess: async (data) => {
      console.log('Delete target mutation succeeded with data:', data);

      // Invalidate all relevant queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/targets'] });

      // Force refetch the targets data
      await refetchTargets();

      // Add a small delay to ensure the UI updates
      setTimeout(async () => {
        await refetchTargets();
        console.log('Refetched targets data after timeout');
      }, 500);

      toast({
        title: 'Deleted sales target',
        description: 'Successfully deleted sales target.',
      });
    },
    onError: (error: Error) => {
      console.error('Delete target mutation error:', error);
      toast({
        title: 'Failed to delete sales target',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleOpenDialog = (target?: Target) => {
    if (target) {
      setEditingTarget(target);
      setFormData({
        userId: target.userId,
        targetType: target.targetType,
        period: target.period,
        startDate: new Date(target.startDate).toISOString().split('T')[0],
        endDate: new Date(target.endDate).toISOString().split('T')[0],
        targetValue: target.targetValue,
        currentValue: target.currentValue || 0
      });
    } else {
      setEditingTarget(null);
      // Set default dates to current month
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString().split('T')[0];

      setFormData({
        userId: users && users.length > 0 ? users[0].id : 0,
        targetType: 'revenue',
        period: 'monthly',
        startDate: firstDay,
        endDate: lastDay,
        targetValue: 0,
        currentValue: 0
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTarget(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'userId') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetData = {
      ...formData,
      ...(editingTarget && { id: editingTarget.id }),
    };
    mutation.mutate(targetData);
  };

  const handleDeleteTarget = (targetId: number) => {
    if (confirm('Are you sure you want to delete this sales target?')) {
      deleteMutation.mutate(targetId);
    }
  };

  const getUserName = (userId: number) => {
    if (!users) return 'Unknown User';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const formatCurrency = (value: number) => {
    // Format as Mauritian Rupee (Rs.)
    if (value >= 1000000) {
      // For values >= 1,000,000, use M suffix (e.g., Rs. 1.5M)
      return `Rs. ${(value / 1000000).toFixed(2).replace(/\.?0+$/, '')}M`;
    } else if (value >= 100000) {
      // For values >= 100,000, use K suffix with no decimal (e.g., Rs. 500K)
      return `Rs. ${(value / 1000).toFixed(0)}K`;
    } else if (value >= 1000) {
      // For values >= 1,000, use K suffix with one decimal (e.g., Rs. 5.3K)
      return `Rs. ${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    // For values < 1,000, just show the value (e.g., Rs. 500)
    return `Rs. ${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sales Targets</CardTitle>
          <CardDescription>Manage performance targets for your sales representatives</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              refetchTargets();
            }}
            type="button"
            variant="outline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg> Refresh
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Target
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {targetsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sales Rep</TableHead>
                <TableHead>Target Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets && targets.length > 0 ? (
                targets.map(target => {
                  const progress = target.currentValue !== null
                    ? Math.min(100, (target.currentValue / target.targetValue) * 100)
                    : 0;

                  return (
                    <TableRow key={target.id}>
                      <TableCell className="font-medium">{getUserName(target.userId)}</TableCell>
                      <TableCell className="capitalize">
                        {target.targetType === 'revenue' ? 'Revenue' :
                         target.targetType === 'deals' ? 'Deals Closed' :
                         target.targetType === 'gp' ? 'Gross Profit' : target.targetType}
                      </TableCell>
                      <TableCell className="capitalize">{target.period}</TableCell>
                      <TableCell>
                        {new Date(target.startDate).toLocaleDateString()} to {new Date(target.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {target.targetType === 'deals'
                          ? target.targetValue
                          : formatCurrency(target.targetValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{Math.round(progress)}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {target.targetType === 'deals'
                            ? `${target.currentValue || 0} of ${target.targetValue}`
                            : `${formatCurrency(target.currentValue || 0)} of ${formatCurrency(target.targetValue)}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(target)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTarget(target.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <>
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No sales targets found
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-2 text-xs text-gray-500">
                      Debug info: {targets ? `Targets array is empty (length: ${targets.length})` : 'Targets is null or undefined'}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[500px]" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>{editingTarget ? 'Edit' : 'Add'} Sales Target</DialogTitle>
              <DialogDescription>
                {editingTarget
                  ? 'Update the sales target information.'
                  : 'Set a new performance target for a sales representative.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userId" className="text-right">
                    Sales Rep
                  </Label>
                  <Select
                    name="userId"
                    value={formData.userId.toString()}
                    onValueChange={(value) => handleSelectChange('userId', value)}
                    disabled={!!editingTarget}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select sales rep" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="targetType" className="text-right">
                    Target Type
                  </Label>
                  <Select
                    name="targetType"
                    value={formData.targetType}
                    onValueChange={(value) => handleSelectChange('targetType', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select target type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="deals">Number of Deals</SelectItem>
                      <SelectItem value="gp">Gross Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="period" className="text-right">
                    Period
                  </Label>
                  <Select
                    name="period"
                    value={formData.period}
                    onValueChange={(value) => handleSelectChange('period', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="targetValue" className="text-right">
                    Target Value
                  </Label>
                  <Input
                    id="targetValue"
                    name="targetValue"
                    type="number"
                    value={formData.targetValue}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                    min="0"
                    step={formData.targetType === 'deals' ? '1' : '0.01'}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currentValue" className="text-right">
                    Current Value
                  </Label>
                  <Input
                    id="currentValue"
                    name="currentValue"
                    type="number"
                    value={formData.currentValue}
                    onChange={handleInputChange}
                    className="col-span-3"
                    min="0"
                    step={formData.targetType === 'deals' ? '1' : '0.01'}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTarget ? 'Update' : 'Add'} Target
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Bulk Upload Section removed
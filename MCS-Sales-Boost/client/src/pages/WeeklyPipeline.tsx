import React from "react";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import {
  Loader2, Calendar, ArrowRight, Plus, Mail, Phone, Activity, Target, ArrowUp, ArrowDown, MessageSquare
} from 'lucide-react';
import { queryClient, apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { getCurrentUser } from '../lib/auth';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Deal, User, Customer, Target as SalesTarget, insertDealSchema, NewDeal } from '../shared/schema';
import { z } from 'zod';
import { toast } from '../components/ui/toast';
import { formatCurrency } from '../lib/currency';

// Helper functions for date manipulation
const getWeekDates = (date = new Date()) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
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

export default function WeeklyPipeline() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(getWeekDates(selectedDate));
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [weeklyNotes, setWeeklyNotes] = useState('');
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [newDealDialogOpen, setNewDealDialogOpen] = useState(false);

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setSelectedUser(user.id);
        setIsCurrentUserAdmin(user.role === 'admin' || user.role === 'manager');
      }
    };

    loadCurrentUser();
  }, []);

  // Update week dates when selected date changes
  useEffect(() => {
    setWeekDates(getWeekDates(selectedDate));
  }, [selectedDate]);

  // Fetch all users for admin/manager view
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isCurrentUserAdmin
  });

  // Add this query to fetch all deals
  const { data: allDeals, isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/deals');
    }
  });

  // Add console.log to debug
  useEffect(() => {
    console.log('Fetched deals:', allDeals);
  }, [allDeals]);

  // Fetch customers for lookups
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch targets for this user
  const { data: targets } = useQuery<SalesTarget[]>({
    queryKey: ['/api/targets', selectedUser],
    queryFn: async () => {
      if (!selectedUser) return [];
      return await apiRequest('GET', `/api/targets?userId=${selectedUser}`);
    },
    enabled: !!selectedUser
  });

  // Filter deals for the selected user
  const userDeals = allDeals?.filter(deal =>
    (!selectedUser || deal.userId === selectedUser)
  ) || [];

  // Filter deals happening/updated this week
  const weekDeals = userDeals.filter(deal => {
    const dealDate = deal.updatedAt
      ? new Date(deal.updatedAt)
      : (deal.createdAt ? new Date(deal.createdAt) : new Date());
    return weekDates[0] <= dealDate && dealDate <= weekDates[6];
  });

  // Count deals by stage
  const dealsByStage = {
    prospecting: userDeals.filter(d => d.stage === 'prospecting').length,
    qualification: userDeals.filter(d => d.stage === 'qualification').length,
    proposal: userDeals.filter(d => d.stage === 'proposal').length,
    negotiation: userDeals.filter(d => d.stage === 'negotiation').length,
    closed_won: userDeals.filter(d => d.stage === 'closed_won').length,
    closed_lost: userDeals.filter(d => d.stage === 'closed_lost').length,
  };

  // Calculate week's closed deal value
  const weekClosedValue = weekDeals
    .filter(d => d.stage === 'closed_won')
    .reduce((sum, deal) => sum + deal.value, 0);

  // Currently active target
  const currentTarget = targets?.find(target => {
    const now = new Date();
    return new Date(target.startDate) <= now && new Date(target.endDate) >= now;
  });

  // Change week handlers
  const handlePreviousWeek = () => {
    setSelectedDate(getPreviousWeek(selectedDate));
  };

  const handleNextWeek = () => {
    setSelectedDate(getNextWeek(selectedDate));
  };

  // Customer lookup function
  const getCustomerName = (customerId: number) => {
    if (!customers) return 'Unknown Customer';
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Handle user selection
  const handleUserChange = (userId: string) => {
    setSelectedUser(parseInt(userId));
  };

  // Using the centralized formatCurrency utility

  // Handle save notes
  const handleSaveNotes = async () => {
    try {
      // Implement API call to save notes
      // await apiRequest('POST', '/api/weekly-notes', {
      //   userId: selectedUser,
      //   weekStartDate: weekDates[0].toISOString(),
      //   notes: weeklyNotes
      // });

      toast({
        title: 'Notes saved',
        description: 'Weekly notes have been saved successfully.',
      });
      setNotesDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to save notes',
        description: 'There was an error saving your notes.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Weekly Pipeline</h1>
          <p className="text-muted-foreground">Monitor your sales pipeline on a weekly basis</p>
        </div>

        <div className="flex items-center space-x-4">
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

          {isCurrentUserAdmin && users && (
            <Select
              value={selectedUser?.toString() || ''}
              onValueChange={handleUserChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Performance</CardTitle>
            <CardDescription>Deals closed this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(weekClosedValue)}</div>
            <div className="flex items-center mt-2">
              <div className="text-sm text-muted-foreground">
                {weekDeals.filter(d => d.stage === 'closed_won').length} deals closed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Target</CardTitle>
            <CardDescription>Current performance target</CardDescription>
          </CardHeader>
          <CardContent>
            {currentTarget ? (
              <>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">
                    {currentTarget.targetType === 'revenue' ? 'Revenue' :
                     currentTarget.targetType === 'deals' ? 'Deals' : 'Gross Profit'}
                  </span>
                  <span className="text-sm">
                    {currentTarget.currentValue || 0} / {currentTarget.targetValue}
                    {currentTarget.targetType !== 'deals' && ' USD'}
                  </span>
                </div>
                <Progress
                  value={(currentTarget.currentValue || 0) / currentTarget.targetValue * 100}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(currentTarget.endDate).toLocaleDateString()} deadline
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No active targets</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Notes</CardTitle>
            <CardDescription>Key activities and reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {weeklyNotes ? weeklyNotes.substring(0, 50) + '...' : 'No notes for this week'}
              </div>
              <Button size="sm" onClick={() => setNotesDialogOpen(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                {weeklyNotes ? 'Edit' : 'Add'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
          <CardDescription>Review your deals by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0">
            {/* Pipeline Stages */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 w-full">
              {Object.entries(dealsByStage).map(([stage, count]) => (
                <div key={stage} className="rounded-md border p-4 text-center">
                  <h3 className="capitalize font-medium mb-2">
                    {stage.replace('_', ' ')}
                  </h3>
                  <div className="text-2xl font-bold">{count}</div>
                  {stage === 'closed_won' && (
                    <div className="text-sm text-green-600 mt-1">
                      {formatCurrency(userDeals
                        .filter(d => d.stage === 'closed_won')
                        .reduce((sum, deal) => sum + deal.value, 0))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Deal Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>This Week's Deal Activity</CardTitle>
            <CardDescription>Deals created or updated this week</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewDealDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekDeals.map(deal => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.name}</TableCell>
                    <TableCell>{getCustomerName(deal.customerId)}</TableCell>
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
                      {new Date(deal.updatedAt || deal.createdAt || new Date()).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No deals found for this week. Create a new deal to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Weekly Notes</DialogTitle>
            <DialogDescription>
              Add notes, reminders, and key activities for this week
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="notes" className="mb-2 block">
              Notes for {formatWeekRange(weekDates)}
            </Label>
            <Textarea
              id="notes"
              value={weeklyNotes}
              onChange={(e) => setWeeklyNotes(e.target.value)}
              placeholder="Enter your notes, key activities, and reminders for this week"
              className="min-h-[150px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Deal Dialog */}
      <NewDealDialog
        open={newDealDialogOpen}
        onOpenChange={setNewDealDialogOpen}
        selectedUser={selectedUser}
        customers={customers || []}
        onDealCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
        }}
      />
    </div>
  );
}

// New Deal Dialog Component
interface NewDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: number | null;
  customers: Customer[];
  onDealCreated: () => void;
}

function NewDealDialog({ open, onOpenChange, selectedUser, customers, onDealCreated }: NewDealDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Modified schema to handle string inputs and convert them
  const formSchema = insertDealSchema
    .extend({
      value: z.preprocess(
        (val) => (val === '' ? 0 : Number(val)),
        z.number().min(0, { message: "Value must be a positive number" })
      ),
      gpPercentage: z.preprocess(
        (val) => (val === '' ? null : Number(val)),
        z.number().min(0).max(100).nullable().optional()
      ),
      customerId: z.preprocess(
        (val) => (typeof val === 'string' ? parseInt(val) : val),
        z.number().min(1, { message: "Please select a customer" })
      )
    });

  // Setup form with validation
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      value: "",
      category: "wireless",
      stage: "prospecting",
      customerId: "",
      userId: selectedUser || 0,
      gpPercentage: "",
      region: "",
      clientType: "B2B",
      dealType: "new"
    }
  });

  // Update userId when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      form.setValue("userId", selectedUser);
    }
  }, [selectedUser, form]);

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: async (dealData: any) => {
      const response = await apiRequest('POST', '/api/deals', dealData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Deal created successfully",
      });
      form.reset();
      onOpenChange(false);
      // Invalidate both deals and dashboard queries
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      onDealCreated();
    },
    onError: (error: Error) => {
      console.error('Deal creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create deal",
        variant: "destructive"
      });
    }
  });

  function onSubmit(data: any) {
    createDealMutation.mutate({
      name: data.name,
      value: parseFloat(data.value),
      category: data.category,
      stage: data.stage,
      customerName: data.customerName,
      clientType: data.clientType
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription>
            Enter the details of your new sales opportunity
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter deal name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Value ($)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="5000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="wireless">Wireless</SelectItem>
                        <SelectItem value="fiber">Fiber</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="prospecting">Prospecting</SelectItem>
                        <SelectItem value="qualification">Qualification</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="closed_won">Closed Won</SelectItem>
                        <SelectItem value="closed_lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gpPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GP % (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="25"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Northeast" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "B2B"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="B2B">B2B</SelectItem>
                        <SelectItem value="carrier">Carrier</SelectItem>
                        <SelectItem value="regional">Regional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dealType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "new"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select deal type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="renewal">Renewal</SelectItem>
                      <SelectItem value="upsell">Upsell</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDealMutation.isPending}>
                {createDealMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Deal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}









import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CalendarIcon } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { usePipeline } from "../../contexts/PipelineContext";
import { formatCurrency } from "../../lib/utils";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Calendar } from "../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

// Define the form schema
const formSchema = z.object({
  mrc: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: "MRC must be a positive number" })
  ),
  nrc: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: "NRC must be a positive number" })
  ),
  category: z.string(),
  stage: z.string(),
  customerName: z.string().min(2, { message: "Customer name must be at least 2 characters" }),
  clientType: z.string(),
  dealType: z.string().optional(),
  contractLength: z.preprocess(
    (val) => (val === '' ? 12 : Number(val)),
    z.number().min(1, { message: "Contract length must be at least 1 month" })
  ),
  creationDate: z.date({
    required_error: "Please select a date",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface NewDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealCreated?: () => void;
}

export default function NewDealDialog({ open, onOpenChange, onDealCreated }: NewDealDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addDeal } = usePipeline();

  // Setup form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mrc: 0,
      nrc: 0,
      category: "wireless",
      stage: "prospecting",
      customerName: "",
      clientType: "B2B",
      dealType: "new",
      contractLength: 12,
      creationDate: new Date()
    }
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  // Calculate TCV
  const mrc = Math.max(0, Number(form.watch('mrc') || 0) || 0); // Ensure it's a valid number and at least 0
  const nrc = Math.max(0, Number(form.watch('nrc') || 0) || 0); // Ensure it's a valid number and at least 0
  const contractLength = Math.max(1, Number(form.watch('contractLength') || 12) || 12); // Ensure it's at least 1 month
  const tcv = (mrc * contractLength) + nrc;

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: async (dealData: FormValues) => {
      // Ensure all numeric values are valid numbers
      const safeMrc = Math.max(0, Number(dealData.mrc) || 0);
      const safeNrc = Math.max(0, Number(dealData.nrc) || 0);
      const safeContractLength = Math.max(1, Number(dealData.contractLength) || 12);
      const safeTcv = (safeMrc * safeContractLength) + safeNrc;

      // Ensure the creation date is properly formatted
      let creationDate;
      try {
        if (dealData.creationDate instanceof Date && !isNaN(dealData.creationDate.getTime())) {
          creationDate = dealData.creationDate.toISOString();
        } else {
          creationDate = new Date().toISOString();
        }
      } catch (error) {
        console.error('Error formatting creation date:', error);
        creationDate = new Date().toISOString();
      }

      const payload = {
        mrc: safeMrc,
        nrc: safeNrc,
        tcv: safeTcv,
        value: safeTcv, // Add value field to match database schema
        category: dealData.category,
        stage: dealData.stage,
        customerName: dealData.customerName,
        clientType: dealData.clientType,
        dealType: dealData.dealType || 'new',
        contractLength: safeContractLength,
        creationDate: creationDate
      };

      console.log('Sending deal payload:', payload);
      const response = await apiRequest('POST', '/api/deals', payload);
      return response;
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: "Deal created successfully" });
      form.reset();
      onOpenChange(false);
      addDeal(data);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      if (onDealCreated) onDealCreated();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create deal", variant: "destructive" });
    }
  });

  function onSubmit(data: FormValues) {
    createDealMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription className="text-xs">
            Enter the details of your new sales opportunity
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="mrc"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">MRC (Rs.)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Monthly Recurring Cost"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nrc"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">NRC (Rs.)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Non Recurring Cost"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="contractLength"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Contract Length (months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="12"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="space-y-1">
                <FormLabel className="text-xs">TCV (Rs.)</FormLabel>
                <div className="h-8 flex items-center px-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-semibold">
                  {formatCurrency(tcv)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="wireless">Wireless</SelectItem>
                        <SelectItem value="fiber">Fiber</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Stage</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="prospecting">Prospecting</SelectItem>
                        <SelectItem value="qualification">Qualification</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="closed_won">Closed Won</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Customer Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter customer name"
                      {...field}
                      className="h-8 text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="clientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="B2B">B2B</SelectItem>
                        <SelectItem value="B2C">B2C</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                        <SelectItem value="SMB">SMB</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <FormField
              control={form.control}
              name="creationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Creation Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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

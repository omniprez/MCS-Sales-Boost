import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ArrowUpDown, Info } from "lucide-react";
import { Button } from "../ui/button";
import { formatCurrency } from "../../lib/utils";
import DealEditDialog from "../deals/DealEditDialog";
import { useAuth } from "../../contexts/AuthContext";

interface Deal {
  id: number;
  name: string;
  value: number;
  category: string;
  stage: string;
  clientType: string;
  daysInStage: number;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
  customer: {
    name: string;
  };
}

interface DealListViewProps {
  deals: Deal[];
  isLoading: boolean;
}

const DealListView = ({ deals, isLoading }: DealListViewProps) => {
  const [sortField, setSortField] = useState<keyof Deal | "customer">("customer");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const dealsPerPage = 10;
  const { user } = useAuth();

  // Function to check if the current user can edit a deal
  const canEditDeal = (deal: Deal): boolean => {
    if (!user) return false;

    // User can edit if they are the owner of the deal or if they are an admin
    const isOwner = deal.user.id === user.id;
    const isAdmin = user.role === 'admin' || user.role === 'administrator' || user.role === 'superuser';

    return isOwner || isAdmin;
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'bg-blue-100 text-blue-700';
      case 'qualification': return 'bg-amber-100 text-amber-700';
      case 'proposal': return 'bg-indigo-100 text-indigo-700';
      case 'negotiation': return 'bg-yellow-100 text-yellow-700';
      case 'closed_won': return 'bg-green-100 text-green-700';
      case 'closed_lost': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStage = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ');
  };

  const handleSort = (field: keyof Deal | "customer") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedDeals = [...deals].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle nested properties
    if (sortField === "user") {
      aValue = a.user.name;
      bValue = b.user.name;
    } else if (sortField === "customer") {
      aValue = a.customer?.name || '';
      bValue = b.customer?.name || '';
    }

    // Handle numeric values
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    // Handle string values
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedDeals.length / dealsPerPage);
  const indexOfLastDeal = currentPage * dealsPerPage;
  const indexOfFirstDeal = indexOfLastDeal - dealsPerPage;
  const currentDeals = sortedDeals.slice(indexOfFirstDeal, indexOfLastDeal);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const SortIcon = ({ field }: { field: keyof Deal | "customer" }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading deals...</div>;
  }

  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No deals found</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-blue-100">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider cursor-pointer w-1/4"
                  onClick={() => handleSort("customer")}
                >
                  <div className="flex items-center">
                    Customer Name
                    <SortIcon field="customer" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider cursor-pointer w-1/8"
                  onClick={() => handleSort("value")}
                >
                  <div className="flex items-center">
                    Value
                    <SortIcon field="value" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider cursor-pointer w-1/8"
                  onClick={() => handleSort("stage")}
                >
                  <div className="flex items-center">
                    Stage
                    <SortIcon field="stage" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider cursor-pointer w-1/6"
                  onClick={() => handleSort("user")}
                >
                  <div className="flex items-center">
                    Owner
                    <SortIcon field="user" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider cursor-pointer w-1/8"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center">
                    Category
                    <SortIcon field="category" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider cursor-pointer w-1/12"
                  onClick={() => handleSort("daysInStage")}
                >
                  <div className="flex items-center">
                    Days
                    <SortIcon field="daysInStage" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider w-1/12"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentDeals.map((deal, index) => (
                <tr key={deal.id} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          deal.category === "wireless" ? "bg-blue-500" : "bg-emerald-500"
                        } mr-2`}
                      ></div>
                      <div
                        className="text-sm font-medium text-gray-900"
                        title={`Deal: ${deal.name}`}
                      >
                        {deal.customer?.name || 'Unknown Customer'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(deal.value)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(
                        deal.stage
                      )}`}
                    >
                      {formatStage(deal.stage)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {deal.user.avatar ? (
                        <img
                          src={deal.user.avatar}
                          alt={deal.user.name}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-2">
                          {deal.user.name.charAt(0)}
                        </div>
                      )}
                      <div className="text-sm text-gray-700">{deal.user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {deal.category === "wireless" ? "Wireless" : "Fiber"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{deal.daysInStage} days</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {canEditDeal(deal) ? (
                      <button
                        className="inline-flex items-center justify-center p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                        onClick={() => setEditingDeal(deal)}
                        title="Edit deal"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        className="inline-flex items-center justify-center p-2 rounded-full bg-gray-200 text-gray-500 cursor-not-allowed"
                        disabled
                        title={`This deal belongs to ${deal.user.name}`}
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-blue-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstDeal + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastDeal, deals.length)}
                  </span>{" "}
                  of <span className="font-medium">{deals.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-blue-50"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <Button
                      key={index}
                      variant={currentPage === index + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => paginate(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                        currentPage === index + 1
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 hover:bg-blue-50"
                      }`}
                    >
                      {index + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-blue-50"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingDeal && (
        <DealEditDialog
          isOpen={!!editingDeal}
          onClose={() => setEditingDeal(null)}
          deal={editingDeal}
        />
      )}
    </>
  );
};

export default DealListView;

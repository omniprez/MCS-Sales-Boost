import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Define interfaces for performance data
interface ProductPerformance {
  name: string;
  revenue: number;
  deals: number;
  gpPercentage: number;
  trend: number;
}

interface PerformanceData {
  quotaCompletion: number;
  winRate: number;
  productPerformance: ProductPerformance[];
}

const PerformanceOverview = () => {
  const { data: performance, isLoading } = useQuery<PerformanceData>({
    queryKey: ['/api/performance'],
  });

  // Dummy chart data - would be replaced with real data from the API
  const chartData = [
    { name: 'Jan', wireless: 40, fiber: 24 },
    { name: 'Feb', wireless: 30, fiber: 35 },
    { name: 'Mar', wireless: 20, fiber: 40 },
    { name: 'Apr', wireless: 45, fiber: 30 },
    { name: 'May', wireless: 55, fiber: 25 },
    { name: 'Jun', wireless: 60, fiber: 35 },
  ];

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-md">
            All Products
          </button>
          <button className="px-3 py-1.5 text-xs font-medium bg-white border border-[#DFE1E6] text-[#6B778C] rounded-md">
            Wireless
          </button>
          <button className="px-3 py-1.5 text-xs font-medium bg-white border border-[#DFE1E6] text-[#6B778C] rounded-md">
            Fiber
          </button>
        </div>
      </div>
      {isLoading ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Skeleton className="w-full h-28 rounded-lg" />
            <Skeleton className="w-full h-28 rounded-lg" />
          </div>
          <Skeleton className="w-full h-64 mb-6" />
          <Skeleton className="w-full h-64" />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border border-[#DFE1E6] p-4 bg-white shadow-sm">
              <h4 className="text-sm font-medium text-[#6B778C]">Quota Completion</h4>
              <div className="mt-3 flex items-center">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#DFE1E6"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#36B37E"
                      strokeWidth="3"
                      strokeDasharray={`${performance?.quotaCompletion || 0}, 100`}
                    />
                  </svg>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <span className="text-lg font-bold">{performance?.quotaCompletion || 0}%</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">$752K</p>
                  <p className="text-sm text-[#6B778C]">of $1M target</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[#DFE1E6] p-4 bg-white shadow-sm">
              <h4 className="text-sm font-medium text-[#6B778C]">Win Rate</h4>
              <div className="mt-3 flex items-center">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#DFE1E6"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#0052CC"
                      strokeWidth="3"
                      strokeDasharray={`${performance?.winRate || 0}, 100`}
                    />
                  </svg>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <span className="text-lg font-bold">{performance?.winRate || 0}%</span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <p className="text-2xl font-bold">67</p>
                    <p className="text-sm text-[#6B778C] ml-2">of 108 deals</p>
                  </div>
                  <div className="flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#36B37E] mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <p className="text-xs text-[#36B37E]">4.3% vs last quarter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium mb-4">Sales by Product Category</h4>
            <div className="h-64 w-full rounded-lg bg-white p-4 border border-[#DFE1E6] shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="wireless" stackId="1" stroke="#0052CC" fill="#0052CC" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="fiber" stackId="1" stroke="#36B37E" fill="#36B37E" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">Product Performance</h4>
            <div className="overflow-x-auto bg-white p-4 border border-[#DFE1E6] rounded-lg shadow-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#DFE1E6]">
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#6B778C] uppercase tracking-wider">Product</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-[#6B778C] uppercase tracking-wider">Revenue</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-[#6B778C] uppercase tracking-wider">Deals</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-[#6B778C] uppercase tracking-wider">GP %</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-[#6B778C] uppercase tracking-wider">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {performance?.productPerformance && performance.productPerformance.map((product, index) => (
                    <tr key={index} className="border-b border-[#DFE1E6] hover:bg-[#FAFBFC]">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full ${product.name.toLowerCase().includes('wireless') ? 'bg-blue-500' : 'bg-green-500'} mr-2`}></span>
                          <span className="text-sm font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                        ${product.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right text-sm">
                        {product.deals}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium text-[#36B37E]">
                        {product.gpPercentage}%
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.trend >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.trend >= 0 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                          {product.trend >= 0 ? `+${product.trend}` : product.trend}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceOverview;

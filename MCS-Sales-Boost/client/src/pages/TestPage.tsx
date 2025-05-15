import React from "react";
import { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";

export default function TestPage() {
  const [apiStatus, setApiStatus] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);

  // Test endpoints to check
  const endpoints = [
    '/api/me',
    '/api/dashboard',
    '/api/pipeline',
    '/api/leaderboard',
    '/api/activities',
    '/api/performance'
  ];

  useEffect(() => {
    const testEndpoints = async () => {
      setIsLoading(true);
      const results: {[key: string]: boolean} = {};

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          results[endpoint] = response.ok;
        } catch (error) {
          console.error(`Error testing ${endpoint}:`, error);
          results[endpoint] = false;
        }
      }

      setApiStatus(results);
      setIsLoading(false);
    };

    testEndpoints();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle className="text-2xl">MCS SalesBoost</CardTitle>
          <CardDescription className="text-blue-100">System Status Check</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Application Status</h2>
            <p className="text-gray-600 mb-4">
              This page checks if the frontend and API endpoints are working correctly.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-800">Frontend Status</h3>
              <p className="text-green-700">✓ React Application Loaded Successfully</p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-800">API Status</h3>
              {isLoading ? (
                <p>Testing API endpoints...</p>
              ) : (
                <ul className="space-y-2 mt-2">
                  {endpoints.map(endpoint => (
                    <li key={endpoint} className="flex items-center">
                      <span className={apiStatus[endpoint] ? "text-green-600" : "text-red-600"}>
                        {apiStatus[endpoint] ? "✓" : "✗"}
                      </span>
                      <span className="ml-2">{endpoint}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t">
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Go to Dashboard
          </Button>
          <Button className="ml-auto" onClick={() => window.location.reload()}>
            Refresh Status
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
import React from "react";
import { useState, useEffect } from 'react';
import { useToast } from "../hooks/use-toast";
import { checkAuth, login, logout } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useLocation } from 'wouter';

export default function Debug() {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      setAuthStatus('Checking...');
      const user = await checkAuth();
      if (user) {
        setAuthStatus('Authenticated');
        setUser(user);
      } else {
        setAuthStatus('Not authenticated');
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setAuthStatus('Error checking auth');
      setUser(null);
    }
  }

  async function handleLogin() {
    try {
      const result = await login(username, password);
      if (result.success) {
        toast({
          title: 'Login successful',
          description: `Welcome, ${result.user?.name || username}!`,
        });
        checkAuthStatus();
      } else {
        toast({
          title: 'Login failed',
          description: result.message || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  }

  async function handleLogout() {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });
      checkAuthStatus();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout error',
        description: 'An error occurred during logout',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Page</h1>
      
      <Tabs defaultValue="auth">
        <TabsList className="mb-4">
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="routes">Navigation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>Check and manage your authentication state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="font-medium">Status: <span className="font-bold">{authStatus}</span></div>
                {user && (
                  <div className="mt-2 p-4 bg-slate-100 rounded-md">
                    <h3 className="font-medium mb-2">User Data:</h3>
                    <pre className="text-xs overflow-auto">{JSON.stringify(user, null, 2)}</pre>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="space-x-2">
                <Button onClick={handleLogin}>Login</Button>
                <Button onClick={handleLogout} variant="outline">Logout</Button>
              </div>
              <Button onClick={checkAuthStatus} variant="secondary">Check Status</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
              <CardDescription>Navigate to different parts of the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setLocation('/')} className="w-full">Dashboard</Button>
                <Button onClick={() => setLocation('/login')} className="w-full">Login Page</Button>
                <Button onClick={() => setLocation('/debug')} className="w-full">Debug (Current)</Button>
                <Button onClick={() => setLocation('/pipeline')} className="w-full">Sales Pipeline</Button>
                <Button onClick={() => setLocation('/leaderboard')} className="w-full">Leaderboard</Button>
                <Button onClick={() => setLocation('/team')} className="w-full">Team Management</Button>
                <Button onClick={() => setLocation('/achievements')} className="w-full">Achievements</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

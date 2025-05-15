import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  HomeIcon,
  DollarSignIcon,
  UsersIcon,
  BarChartIcon,
  Settings2Icon,
  TrophyIcon,
  GiftIcon,
  UserIcon,
  FileTextIcon,
  ClipboardListIcon,
  ChevronLeft,
  ChevronRight,
  LogOutIcon
} from "lucide-react";
import { Button } from "./ui/button";
import { logout } from "../lib/auth";
import { useToast } from "../hooks/use-toast";
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutFixed2 = ({ children }: LayoutProps) => {
  const [location, setLocation] = useLocation();
  // Only enable sidebar collapse on pipeline page
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isPipelinePage = location === "/pipeline";
  const { toast } = useToast();
  const { user, hasRole } = useAuth();

  // Get user data from the /api/auth/check endpoint instead of /api/me
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/check'],
    staleTime: Infinity,
    onSuccess: (data) => {
      console.log('User data loaded:', data);
      console.log('User object structure:', JSON.stringify(data, null, 2));
      console.log('User name:', data?.user?.name);
      console.log('User role:', data?.user?.role);
      console.log('Is authenticated?', !!data?.authenticated);
      console.log('Has user object?', !!data?.user);
      console.log('Full user object:', data?.user);
    },
    onError: (error) => {
      console.error('Error loading user data:', error);
    }
  });

  // Debug sidebar welcome message visibility
  useEffect(() => {
    console.log('Sidebar welcome message conditions:');
    console.log('- user?.authenticated:', !!user?.authenticated);
    console.log('- user?.user:', !!user?.user);
    console.log('- !sidebarCollapsed:', !sidebarCollapsed);
    console.log('- Should show welcome message:', !!user?.authenticated && !!user?.user && !sidebarCollapsed);
    console.log('- Welcome message text:', user?.user?.role === 'admin' ? 'Welcome, Admin!' : `Welcome, ${user?.user?.name || 'User'}!`);
  }, [user, sidebarCollapsed]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      // Redirect to login page using direct navigation
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Add data-page attribute to body element for CSS targeting
  useEffect(() => {
    const pageName = location.startsWith('/') ? location.substring(1) : location;
    document.body.setAttribute('data-page', pageName);
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, [location]);

  // Navigation handler that uses direct browser navigation
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className={`sidebar ${isPipelinePage && sidebarCollapsed ? 'collapsed' : 'expanded'} bg-white border-r p-4 relative shadow-sm`}>
          <div className="flex flex-col h-full">
            <div className="flex flex-col mb-8">
              <div className="flex items-center justify-between">
                <div className={`${isPipelinePage && sidebarCollapsed ? 'hidden' : ''}`}>
                  <h1 className="text-xl font-bold mb-2">
                    <span className="text-gray-700">MCS</span> <span className="text-blue-600">SalesBoost</span>
                  </h1>
                </div>
                {isPipelinePage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="ml-auto text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  >
                    {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                  </Button>
                )}
              </div>

              {/* Standalone welcome message */}
              {!sidebarCollapsed && (
                <div className="mb-4 mt-2 py-2 px-3 bg-blue-50 rounded-md border border-blue-100">
                  {user?.role === 'admin' ? (
                    <p className="text-sm font-medium text-blue-700">Welcome, Admin!</p>
                  ) : user?.name ? (
                    <p className="text-sm font-medium text-blue-700">Welcome, {user.name}!</p>
                  ) : (
                    <p className="text-sm font-medium text-blue-700">Welcome!</p>
                  )}
                </div>
              )}
            </div>

            <nav className="space-y-2">
              {/* Dashboard */}
              <div
                onClick={() => navigateTo('/')}
                className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${
                  location === "/"
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } transition-colors ${isPipelinePage && sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <HomeIcon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-3'} ${location === "/" ? "text-indigo-600" : "text-gray-500"}`} />
                <span className={isPipelinePage && sidebarCollapsed ? 'hidden' : ''}>Dashboard</span>
              </div>

              {/* Sales Pipeline */}
              <div
                onClick={() => navigateTo('/pipeline')}
                className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${
                  location === "/pipeline"
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } transition-colors ${isPipelinePage && sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <DollarSignIcon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-3'} ${location === "/pipeline" ? "text-emerald-600" : "text-gray-500"}`} />
                <span className={isPipelinePage && sidebarCollapsed ? 'hidden' : ''}>Sales Pipeline</span>
              </div>

              {/* Team */}
              <div
                onClick={() => navigateTo('/team')}
                className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${
                  location === "/team"
                    ? "bg-amber-50 text-amber-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } transition-colors ${isPipelinePage && sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <UsersIcon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-3'} ${location === "/team" ? "text-amber-600" : "text-gray-500"}`} />
                <span className={isPipelinePage && sidebarCollapsed ? 'hidden' : ''}>Team</span>
              </div>

              {/* Leaderboard */}
              <div
                onClick={() => navigateTo('/leaderboard')}
                className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${
                  location === "/leaderboard"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } transition-colors ${isPipelinePage && sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <BarChartIcon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-3'} ${location === "/leaderboard" ? "text-blue-600" : "text-gray-500"}`} />
                <span className={isPipelinePage && sidebarCollapsed ? 'hidden' : ''}>Leaderboard</span>
              </div>

              {/* Admin - Only visible to admin users */}
              {hasRole && hasRole('admin') && (
                <div
                  onClick={() => navigateTo('/admin')}
                  className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${
                    location === "/admin"
                      ? "bg-purple-50 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } transition-colors ${isPipelinePage && sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Settings2Icon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-3'} ${location === "/admin" ? "text-purple-600" : "text-gray-500"}`} />
                  <span className={isPipelinePage && sidebarCollapsed ? 'hidden' : ''}>
                    Admin
                  </span>
                </div>
              )}
            </nav>

            {/* User Profile Section */}
            {user && (
              <div className="mt-auto pt-4 border-t border-gray-200">
                <div className={`flex items-center ${isPipelinePage && sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm">
                    <UserIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className={isPipelinePage && sidebarCollapsed ? 'hidden' : ''}>
                    <p className="font-medium text-gray-800">{user.name || 'Admin User'}</p>
                    <p className="text-sm text-gray-500">Role: {user.role || 'Administrator'}</p>
                    <p className="text-xs text-gray-400">ID: {user.id}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sign Out Button - Positioned at the very bottom of the sidebar */}
            <div className={`absolute bottom-4 left-0 right-0 ${isPipelinePage && sidebarCollapsed ? 'px-2' : 'px-4'}`}>
              <Button
                variant="ghost"
                className={`w-full flex items-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${isPipelinePage && sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                onClick={handleSignOut}
                title="Sign Out"
              >
                <LogOutIcon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-2'}`} />
                <span className={isPipelinePage && sidebarCollapsed ? 'hidden' : ''}>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="main-content p-6">

          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutFixed2;

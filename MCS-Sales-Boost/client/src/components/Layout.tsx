import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  HomeIcon,
  DollarSignIcon,
  UsersIcon,
  Settings2Icon,
  TrophyIcon,
  UserIcon,
  LogOutIcon
} from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [location] = useLocation();
  // Only enable sidebar collapse on pipeline page
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isPipelinePage = location === "/pipeline";
  const { toast } = useToast();
  const { user, hasRole, logout } = useAuth();

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
  React.useEffect(() => {
    const pageName = location.startsWith('/') ? location.substring(1) : location;
    document.body.setAttribute('data-page', pageName);
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, [location]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${isPipelinePage ? (sidebarCollapsed ? 'w-16' : 'w-64') : 'w-64'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-blue-600">MCS SalesBoost</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {/* Dashboard */}
              <li>
                <Link href="/">
                  <a className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 ${location === '/' ? 'bg-gray-100' : ''}`}>
                    <HomeIcon className="h-5 w-5" />
                    {(!isPipelinePage || !sidebarCollapsed) && <span>Dashboard</span>}
                  </a>
                </Link>
              </li>

              {/* Sales Pipeline */}
              <li>
                <Link href="/pipeline">
                  <a className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 ${location === '/pipeline' ? 'bg-gray-100' : ''}`}>
                    <DollarSignIcon className="h-5 w-5" />
                    {(!isPipelinePage || !sidebarCollapsed) && <span>Sales Pipeline</span>}
                  </a>
                </Link>
              </li>

              {/* Team */}
              <li>
                <Link href="/team">
                  <a className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 ${location === '/team' ? 'bg-gray-100' : ''}`}>
                    <UsersIcon className="h-5 w-5" />
                    {(!isPipelinePage || !sidebarCollapsed) && <span>Team</span>}
                  </a>
                </Link>
              </li>

              {/* Leaderboard */}
              <li>
                <Link href="/leaderboard">
                  <a className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 ${location === '/leaderboard' ? 'bg-gray-100' : ''}`}>
                    <TrophyIcon className="h-5 w-5" />
                    {(!isPipelinePage || !sidebarCollapsed) && <span>Leaderboard</span>}
                  </a>
                </Link>
              </li>

              {/* Admin Section - Only show for admin users */}
              {hasRole('admin') && (
                <li>
                  <Link href="/admin">
                    <a className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 ${location === '/admin' ? 'bg-gray-100' : ''}`}>
                      <Settings2Icon className="h-5 w-5" />
                      {(!isPipelinePage || !sidebarCollapsed) && <span>Admin</span>}
                    </a>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* User Profile Section */}
          {user && (
            <div className="mt-auto pt-4 border-t border-gray-200">
              <div className={`flex items-center ${isPipelinePage && sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                <div className="p-4">
                  <UserIcon className="h-8 w-8 text-gray-400" />
                </div>
                {(!isPipelinePage || !sidebarCollapsed) && (
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="ml-auto"
                  title="Sign out"
                >
                  <LogOutIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
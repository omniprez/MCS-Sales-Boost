import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  HomeIcon,
  DollarSignIcon,
  UsersIcon,
  BarChartIcon,
  Settings2Icon,
  UserIcon,
  ChevronLeft,
  ChevronRight,
  LogOutIcon
} from "lucide-react";
// Icons removed as they are not being used
import { Button } from "./ui/button";
import { logout } from "../lib/auth";
import { useToast } from "../hooks/use-toast";
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutFixed = ({ children }: LayoutProps) => {
  const [location, setLocation] = useLocation();
  // Only enable sidebar collapse on pipeline page
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isPipelinePage = location === "/pipeline";
  const { toast } = useToast();
  const { hasRole, user } = useAuth();

  // Get user data from the /api/auth/check endpoint instead of /api/me
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/check'],
    staleTime: Infinity,
  });

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      // Redirect to login page
      setLocation('/login');
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

  // Simple navigation item renderer
  const NavItem = ({ href, icon, label, activeClass, inactiveClass }: {
    href: string;
    icon: React.ReactNode;
    label: React.ReactNode;
    activeClass: string;
    inactiveClass: string;
  }) => {
    const isActive = location === href;

    return (
      <Link href={href}>
        <div
          className={`flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer ${
            isActive ? activeClass : inactiveClass
          } ${isPipelinePage && sidebarCollapsed ? 'justify-center' : ''}`}
        >
          {icon}
          <span className={isPipelinePage && sidebarCollapsed ? 'hidden' : ''}>
            {label}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className={`sidebar ${isPipelinePage && sidebarCollapsed ? 'collapsed' : 'expanded'} bg-white border-r p-4 relative shadow-sm`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h1 className={`text-xl font-bold ${isPipelinePage && sidebarCollapsed ? 'hidden' : ''}`}>
                <span className="text-gray-700">MCS</span> <span className="text-blue-600">SalesBoost</span>
              </h1>
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

            <nav className="space-y-2">
              <NavItem
                href="/"
                icon={<HomeIcon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-3'} ${location === "/" ? "text-indigo-600" : "text-gray-500"}`} />}
                label="Dashboard"
                activeClass="bg-indigo-50 text-indigo-700 font-medium"
                inactiveClass="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              />

              <NavItem
                href="/pipeline"
                icon={<DollarSignIcon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-3'} ${location === "/pipeline" ? "text-emerald-600" : "text-gray-500"}`} />}
                label="Sales Pipeline"
                activeClass="bg-emerald-50 text-emerald-700 font-medium"
                inactiveClass="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              />

              <NavItem
                href="/team"
                icon={<UsersIcon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-3'} ${location === "/team" ? "text-amber-600" : "text-gray-500"}`} />}
                label="Team"
                activeClass="bg-amber-50 text-amber-700 font-medium"
                inactiveClass="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              />

              <NavItem
                href="/leaderboard"
                icon={<BarChartIcon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-3'} ${location === "/leaderboard" ? "text-blue-600" : "text-gray-500"}`} />}
                label="Leaderboard"
                activeClass="bg-blue-50 text-blue-700 font-medium"
                inactiveClass="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              />

              {/* Admin - Only visible to admin users */}
              {hasRole && hasRole('admin') && (
                <NavItem
                  href="/admin"
                  icon={<Settings2Icon className={`h-5 w-5 ${isPipelinePage && sidebarCollapsed ? '' : 'mr-3'} ${location === "/admin" ? "text-purple-600" : "text-gray-500"}`} />}
                  label="Admin"
                  activeClass="bg-purple-50 text-purple-700 font-medium"
                  inactiveClass="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                />
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

export default LayoutFixed;
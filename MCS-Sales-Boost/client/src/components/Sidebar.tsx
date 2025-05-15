import React from "react";
import { Link, useLocation } from "wouter";
import { logout } from "../lib/auth";

interface SidebarProps {
  isOpen?: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLocation('/login'); // Redirect to login even if logout fails
    }
  };

  return (
    <>
      {/* Sidebar backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-[280px] bg-[#0747A6] text-white transform transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:static lg:z-0`}
      >
        {/* Close button for mobile */}
        <button
          className="absolute top-4 right-4 text-white lg:hidden"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Logo */}
        <div className="px-6 py-8">
          <h1 className="text-2xl font-bold font-display">
            MCS <span className="text-[#36B37E]">SalesBoost</span>
          </h1>
        </div>

        {/* User profile */}
        {/* User profile section removed as per the new implementation */}

        {/* Navigation */}
        <nav className="px-3">
          <div className="mb-4">
            <div className="px-3 mb-2">
              <h3 className="text-[#B3BAC5] uppercase text-xs font-semibold tracking-wider">
                Main Navigation
              </h3>
            </div>
            <ul className="space-y-1">
              <li>
                <Link href="/dashboard">
                  <div className={`flex items-center px-3 py-2 rounded-md ${
                    location === "/dashboard"
                      ? "bg-[#172B4D] text-white"
                      : "text-[#B3BAC5] hover:bg-[#172B4D] hover:text-white"
                  } transition-colors cursor-pointer`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/deals">
                  <div className={`flex items-center px-3 py-2 rounded-md ${
                    location === "/deals"
                      ? "bg-[#172B4D] text-white"
                      : "text-[#B3BAC5] hover:bg-[#172B4D] hover:text-white"
                  } transition-colors cursor-pointer`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Sales Pipeline
                  </div>
                </Link>
              </li>
              {/* User role-based navigation sections removed as per the new implementation */}
            </ul>
          </div>

          {/* User role-based tools and utilities section removed as per the new implementation */}
        </nav>

        {/* Logout button at the bottom */}
        <div className="absolute bottom-8 left-0 right-0 px-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

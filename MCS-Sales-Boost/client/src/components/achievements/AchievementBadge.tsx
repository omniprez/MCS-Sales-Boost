import React from "react";
import { motion } from "framer-motion";

interface AchievementBadgeProps {
  name: string;
  icon: string;
  type: "earned" | "locked";
}

const AchievementBadge = ({ name, icon, type }: AchievementBadgeProps) => {
  const getIcon = () => {
    switch (icon) {
      case 'trophy':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'medal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'handshake':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getIconColor = () => {
    if (type === "locked") return "text-[#6B778C] opacity-50";
    
    switch (icon) {
      case 'trophy': return 'text-[#FFAB00]';
      case 'medal': return 'text-[#0052CC]';
      case 'handshake': return 'text-[#36B37E]';
      default: return 'text-[#FF5630]';
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center"
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
        type === "earned" 
          ? "bg-[#FAFBFC] border-2 border-[#0052CC]" 
          : "bg-[#FAFBFC] border border-[#DFE1E6]"
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getIconColor()}`}>
          {getIcon()}
        </div>
      </div>
      <p className={`text-xs font-medium text-center max-w-[80px] ${
        type === "earned" ? "text-[#172B4D]" : "text-[#6B778C]"
      }`}>
        {name}
      </p>
    </motion.div>
  );
};

export default AchievementBadge;

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card";

interface AchievementGridProps {
  achievements: Array<{
    id: number;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlockedBy: number;
    isUnlocked: boolean;
  }>;
}

const AchievementGrid = ({ achievements }: AchievementGridProps) => {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-8 text-[#6B778C]">
        <p>No achievements in this category</p>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {achievements.map((achievement) => (
        <Achievement
          key={achievement.id}
          achievement={achievement}
          variants={item}
        />
      ))}
    </motion.div>
  );
};

interface AchievementProps {
  achievement: {
    id: number;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlockedBy: number;
    isUnlocked: boolean;
  };
  variants: any;
}

const Achievement = ({ achievement, variants }: AchievementProps) => {
  const getIcon = () => {
    switch (achievement.icon) {
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
      case 'wifi':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case 'crown':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        );
      case 'users':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'building':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'link':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
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

  const getIconBg = () => {
    if (!achievement.isUnlocked) return "bg-[#DFE1E6] text-[#6B778C]";

    switch (achievement.category) {
      case 'sales': return 'bg-[#FFAB00] bg-opacity-10 text-[#FFAB00]';
      case 'product': return 'bg-[#0052CC] bg-opacity-10 text-[#0052CC]';
      case 'team': return 'bg-[#36B37E] bg-opacity-10 text-[#36B37E]';
      default: return 'bg-[#FF5630] bg-opacity-10 text-[#FF5630]';
    }
  };

  const getCategoryTag = () => {
    switch (achievement.category) {
      case 'sales': return { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Sales' };
      case 'product': return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Product' };
      case 'team': return { bg: 'bg-green-100', text: 'text-green-800', label: 'Team' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: achievement.category };
    }
  };

  const categoryTag = getCategoryTag();

  return (
    <motion.div variants={variants}>
      <Card className={`overflow-hidden ${achievement.isUnlocked ? 'border-[#0052CC]' : ''}`}>
        <CardContent className="p-5">
          <div className="flex items-start">
            <div className={`p-3 rounded-full ${getIconBg()} mr-4`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{achievement.name}</h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryTag.bg} ${categoryTag.text}`}>
                  {categoryTag.label}
                </span>
              </div>
              <p className="text-sm text-[#6B778C] mt-1">{achievement.description}</p>

              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs text-[#6B778C]">
                  {achievement.isUnlocked
                    ? `Earned by ${achievement.unlockedBy} people`
                    : `${achievement.unlockedBy} people earned this`}
                </span>
                {achievement.isUnlocked && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-[#36B37E] bg-opacity-10 text-[#36B37E] rounded-full">
                    Unlocked
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AchievementGrid;

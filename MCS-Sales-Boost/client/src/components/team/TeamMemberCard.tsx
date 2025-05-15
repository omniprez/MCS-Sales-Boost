import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card";

interface TeamMemberCardProps {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  email: string;
  teamId?: number;
}

const TeamMemberCard = ({ id, name, role, avatar, email, teamId }: TeamMemberCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: id * 0.05 }}
    >
      <Card className="overflow-hidden hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-12 h-12 rounded-full mr-4"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-lg font-semibold mr-4">
                {name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-medium">{name}</h3>
              <p className="text-sm text-[#6B778C]">{role}</p>
              <p className="text-xs text-[#6B778C] mt-1">{email}</p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-xs px-2 py-1 rounded-full bg-[#FAFBFC] border border-[#DFE1E6]">
              ID: {id}
            </span>
            <div className="flex space-x-2">
              <button className="p-1 text-[#6B778C] hover:text-[#172B4D] rounded-full hover:bg-[#FAFBFC]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="p-1 text-[#6B778C] hover:text-[#172B4D] rounded-full hover:bg-[#FAFBFC]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeamMemberCard;

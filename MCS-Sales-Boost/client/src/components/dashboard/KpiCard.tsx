import { motion } from "framer-motion";
import React, { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";

interface KpiCardProps {
  label: string;
  value: string | number;
  comparison?: string;
  trend?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

const KpiCard = ({
  label,
  value,
  comparison,
  trend = 0,
  prefix = "",
  suffix = "",
  icon
}: KpiCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const trendClass = trend > 0
    ? "text-green-600"
    : trend < 0
      ? "text-red-600"
      : "text-gray-600";

  const trendIcon = trend > 0
    ? "↑"
    : trend < 0
      ? "↓"
      : "–";

  const trendValue = Math.abs(trend).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden h-full border border-[#DFE1E6] bg-white rounded-xl">
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-[#6B778C]">{label}</h3>
              <div className="flex items-baseline mt-2">
                <span className="text-2xl font-display font-bold">
                  {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                </span>
                {trend !== undefined && trend !== 0 && (
                  <span className={`ml-2 text-xs ${trendClass} font-medium`}>
                    {trendIcon} {trendValue}%
                  </span>
                )}
              </div>
              {comparison && (
                <p className="text-xs text-[#6B778C] mt-1">{comparison}</p>
              )}
            </div>
            {icon && (
              <motion.div
                animate={{
                  scale: isHovered ? 1.05 : 1,
                  rotate: isHovered ? 5 : 0
                }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default KpiCard;

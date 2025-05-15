import React, { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { formatCurrency } from "../../lib/utils";

interface PipelineStageColumnProps {
  title: string;
  count: number;
  value: number;
  highlight?: boolean | "negative";
  children: ReactNode;
}

const PipelineStageColumn = ({
  title,
  count,
  value,
  highlight = false,
  children
}: PipelineStageColumnProps) => {
  // Format currency value using our utility function
  const formattedValue = formatCurrency(value);

  // Determine highlight colors based on the highlight prop
  const getHighlightClasses = () => {
    if (highlight === true) {
      return {
        header: 'bg-green-50',
        text: 'text-green-600'
      };
    } else if (highlight === 'negative') {
      return {
        header: 'bg-red-50',
        text: 'text-red-600'
      };
    } else {
      return {
        header: 'bg-gray-50',
        text: 'text-gray-700'
      };
    }
  };

  const highlightClasses = getHighlightClasses();

  return (
    <Card className="h-full overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <CardHeader className={`p-3 ${highlightClasses.header}`}>
        <div className="text-center">
          <span className={`text-xl font-bold ${highlightClasses.text}`}>
            {count}
          </span>
          <p className="text-xs text-gray-500 mt-1">{title}</p>
          <p className={`text-xs font-semibold mt-1 ${highlightClasses.text}`}>
            {formattedValue}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        <div className="space-y-2">
          {children}
          {count === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              <p>No deals in this stage</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PipelineStageColumn;

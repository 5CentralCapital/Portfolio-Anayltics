import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, AlertCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  type?: 'info' | 'help' | 'warning';
  delay?: number;
  maxWidth?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  type = 'info',
  delay = 500,
  maxWidth = 'max-w-xs'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    setShowTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (showTimeout) clearTimeout(showTimeout);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    const baseArrow = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
    switch (position) {
      case 'top':
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1`;
      case 'bottom':
        return `${baseArrow} bottom-full left-1/2 -translate-x-1/2 -mb-1`;
      case 'left':
        return `${baseArrow} left-full top-1/2 -translate-y-1/2 -ml-1`;
      case 'right':
        return `${baseArrow} right-full top-1/2 -translate-y-1/2 -mr-1`;
      default:
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1`;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-900 text-yellow-100';
      case 'help':
        return 'bg-blue-900 text-blue-100';
      default:
        return 'bg-gray-900 text-white';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${getPositionClasses()} ${maxWidth}`}
        >
          <div className={`px-3 py-2 text-sm rounded-lg shadow-lg ${getTypeColor()}`}>
            {content}
            <div className={getArrowClasses()}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Help icon with tooltip
export const HelpTooltip: React.FC<{
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, position = 'top' }) => (
  <Tooltip content={content} position={position} type="help">
    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
  </Tooltip>
);

// Info icon with tooltip
export const InfoTooltip: React.FC<{
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, position = 'top' }) => (
  <Tooltip content={content} position={position} type="info">
    <Info className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help" />
  </Tooltip>
);

// Warning icon with tooltip
export const WarningTooltip: React.FC<{
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, position = 'top' }) => (
  <Tooltip content={content} position={position} type="warning">
    <AlertCircle className="h-4 w-4 text-yellow-500 hover:text-yellow-600 cursor-help" />
  </Tooltip>
);
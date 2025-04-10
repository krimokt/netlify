import React, { useRef, useEffect } from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string | number;
}

export const ScrollArea = ({ children, className = '', maxHeight = '300px' }: ScrollAreaProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Optional: Add custom scrollbar behavior here if needed
  }, []);
  
  const style = {
    maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
    overflowY: 'auto' as const,
  };
  
  return (
    <div
      ref={scrollAreaRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      <div className="h-full w-full">
        {children}
      </div>
    </div>
  );
};

export default ScrollArea; 
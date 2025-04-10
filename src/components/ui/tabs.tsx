import React, { useState, createContext, useContext } from 'react';

// Create a context for the tabs
const TabsContext = createContext<{
  selectedTab: string;
  setSelectedTab: (id: string) => void;
} | undefined>(undefined);

interface TabsProps {
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({ defaultValue, children, className = '' }: TabsProps) => {
  const [selectedTab, setSelectedTab] = useState(defaultValue || '');

  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ 
  children, 
  value,
  className = '' 
}: { 
  children: React.ReactNode; 
  value: string;
  className?: string 
}) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }
  
  const { selectedTab, setSelectedTab } = context;
  const isSelected = selectedTab === value;
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={() => setSelectedTab(value)}
      className={`px-3 py-1.5 text-sm font-medium transition-all rounded-md ${
        isSelected 
          ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white' 
          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ 
  children, 
  value,
  className = '' 
}: { 
  children: React.ReactNode; 
  value: string;
  className?: string 
}) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }
  
  const { selectedTab } = context;
  
  if (selectedTab !== value) {
    return null;
  }
  
  return (
    <div role="tabpanel" className={`mt-2 ${className}`}>
      {children}
    </div>
  );
}; 
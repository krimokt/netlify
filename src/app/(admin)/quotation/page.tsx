"use client";

import { useState, useEffect } from "react";
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Image from "next/image";
import QuotationFormModal from "@/components/quotation/QuotationFormModal";
import QuotationDetailsModal from "@/components/quotation/QuotationDetailsModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Debug component to show authentication and data fetching status
const SupabaseDebugger = () => {
  const [debug, setDebug] = useState({
    auth: "Checking...",
    userId: null as string | null,
    role: null as string | null,
    quotationCount: null as number | null,
    error: null as string | null,
    expanded: false
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check authentication
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setDebug(prev => ({ ...prev, error: sessionError.message, auth: "Error" }));
          return;
        }

        const userId = session?.session?.user?.id;
        setDebug(prev => ({ 
          ...prev, 
          auth: userId ? "Authenticated" : "Not authenticated",
          userId: userId || null
        }));

        // Try to get user role
        if (userId) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

          if (!profileError && profileData) {
            setDebug(prev => ({ ...prev, role: profileData.role }));
          }
        }

        // Check quotation count
        const { count, error: countError } = await supabase
          .from('quotations')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          setDebug(prev => ({ ...prev, error: `Count error: ${countError.message}` }));
        } else {
          setDebug(prev => ({ ...prev, quotationCount: count }));
        }
      } catch (error) {
        setDebug(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : String(error),
          auth: "Error" 
        }));
      }
    }

    checkAuth();
  }, []);

  const toggleExpand = () => setDebug(prev => ({ ...prev, expanded: !prev.expanded }));

  return (
    <div className="col-span-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-blue-800 dark:text-blue-300 font-medium text-sm">Supabase Connection Status</h3>
        <button 
          onClick={toggleExpand}
          className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
        >
          {debug.expanded ? "Hide Details" : "Show Details"}
        </button>
      </div>
      
      {debug.expanded && (
        <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <p><span className="font-medium">Authentication:</span> {debug.auth}</p>
          {debug.userId && <p><span className="font-medium">User ID:</span> {debug.userId}</p>}
          {debug.role && <p><span className="font-medium">Role:</span> {debug.role}</p>}
          {debug.quotationCount !== null && (
            <p><span className="font-medium">Quotation Count:</span> {debug.quotationCount}</p>
          )}
          {debug.error && (
            <p className="text-red-600 dark:text-red-400">
              <span className="font-medium">Error:</span> {debug.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Define a proper type for the quotation object
interface PriceOption {
  id: string;
  price: string;
  supplier: string;
  deliveryTime: string;
  description?: string;
  modelName?: string;
  modelImage?: string;
}

interface QuotationData {
  id: string;
  quotation_id: string;
  product: {
    name: string;
    image: string;
    category: string;
    description?: string;
    unitGrossWeight?: string;
  };
  quantity: string;
  date: string;
  status: string;
  price?: string;
  shippingMethod: string;
  destination: string;
  priceOptions?: PriceOption[];
  hasImage?: boolean;
  selected_option?: number;
}

// Metrics interface
interface QuotationMetrics {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export default function QuotationPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationData | null>(null);
  const [quotationData, setQuotationData] = useState<QuotationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<QuotationMetrics>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  // Get the current user from auth context
  const { user } = useAuth();

  // Fetch quotation data and metrics from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        console.log("Fetching quotations data...");
        
        // Check current user session first
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
        }
        
        console.log("Current user session:", sessionData?.session ? "Authenticated" : "Not authenticated");
        
        // Get the user ID from the auth context
        const userId = user?.id;
        
        if (!userId) {
          console.warn("No user ID available, showing no quotations");
          setQuotationData([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch quotations with all necessary fields and filter by user_id
        console.log(`Executing quotations query for user_id: ${userId}...`);
        const { data: quotationsData, error: quotationsError } = await supabase
          .from('quotations')
          .select(`
            id,
            quotation_id,
            product_name,
            quantity,
            created_at,
            status,
            shipping_method,
            shipping_country,
            shipping_city,
            image_url,
            service_type,
            product_url,
            selected_option,
            title_option1,
            image_option1,
            total_price_option1,
            delivery_time_option1,
            description_option1,
            title_option2,
            image_option2,
            total_price_option2,
            delivery_time_option2,
            description_option2,
            title_option3,
            image_option3,
            total_price_option3,
            delivery_time_option3,
            description_option3
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (quotationsError) {
          console.error("Error fetching quotations:", quotationsError);
          console.error("Error details:", JSON.stringify(quotationsError, null, 2));
          setQuotationData([]);
          setIsLoading(false);
          return;
        }

        if (!quotationsData || quotationsData.length === 0) {
          console.log("No quotations found for this user");
          setQuotationData([]);
          setMetrics({
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0
          });
          setIsLoading(false);
          return;
        }
        
        console.log(`Quotations retrieved: ${quotationsData.length}`);
        
        // Transform data to match the format expected by the component
        try {
          const formattedData = quotationsData.map(item => {
            // Format price options from the flattened data
            const priceOptions: PriceOption[] = [];
            
            // Add option 1 if it exists
            if (item.title_option1) {
              priceOptions.push({
                id: '1',
                price: item.total_price_option1 ? `$${parseFloat(item.total_price_option1).toLocaleString()}` : 'N/A',
                supplier: item.title_option1,
                deliveryTime: item.delivery_time_option1 || 'N/A',
                description: item.description_option1,
                modelName: item.title_option1,
                modelImage: item.image_option1 || "/images/product/product-01.jpg"
              });
            }
            
            // Add option 2 if it exists
            if (item.title_option2) {
              priceOptions.push({
                id: '2',
                price: item.total_price_option2 ? `$${parseFloat(item.total_price_option2).toLocaleString()}` : 'N/A',
                supplier: item.title_option2,
                deliveryTime: item.delivery_time_option2 || 'N/A',
                description: item.description_option2,
                modelName: item.title_option2,
                modelImage: item.image_option2 || "/images/product/product-01.jpg"
              });
            }
            
            // Add option 3 if it exists
            if (item.title_option3) {
              priceOptions.push({
                id: '3',
                price: item.total_price_option3 ? `$${parseFloat(item.total_price_option3).toLocaleString()}` : 'N/A',
                supplier: item.title_option3,
                deliveryTime: item.delivery_time_option3 || 'N/A',
                description: item.description_option3,
                modelName: item.title_option3,
                modelImage: item.image_option3 || "/images/product/product-01.jpg"
              });
            }

            // Calculate average price from options
            let price;
            if (priceOptions.length > 0) {
              const validPrices = priceOptions
                .map(opt => parseFloat(opt.price.replace(/[$,]/g, '')))
                .filter(p => !isNaN(p));
              
              if (validPrices.length > 0) {
                const average = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
                price = `$${average.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
            
            return {
              id: item.quotation_id || item.id,
              quotation_id: item.quotation_id || `QT-${item.id}`,
              product: {
                name: item.product_name || "Unnamed Product",
                image: item.image_url || "/images/product/product-01.jpg",
                category: item.service_type || "Uncategorized",
                description: item.product_url ? `Reference URL: ${item.product_url}` : undefined
              },
              quantity: `${item.quantity || 0} units`,
              date: item.created_at ? new Date(item.created_at).toLocaleDateString() : "No date",
              status: item.status || "Pending",
              price: price,
              shippingMethod: item.shipping_method || "Sea Freight",
              destination: `${item.shipping_city || ""}, ${item.shipping_country || ""}`.trim().replace(/^,\s*/, ""),
              priceOptions: priceOptions,
              hasImage: !!item.image_url,
              selected_option: item.selected_option
            };
          });
          
          console.log("Data formatted successfully:", formattedData.length);
          setQuotationData(formattedData);
          
          // Calculate metrics
          const total = quotationsData.length;
          const approved = quotationsData.filter(item => item.status === "Approved").length;
          const pending = quotationsData.filter(item => item.status === "Pending").length;
          const rejected = quotationsData.filter(item => item.status === "Rejected").length;
          
          console.log(`Metrics - Total: ${total}, Approved: ${approved}, Pending: ${pending}, Rejected: ${rejected}`);
          
          setMetrics({
            total,
            approved,
            pending,
            rejected
          });
        } catch (formatError) {
          console.error("Error formatting data:", formatError);
        }
      } catch (error) {
        console.error("Exception fetching data:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [user?.id]); // Add user?.id as a dependency

  // Check if there are any approved quotations
  const hasApprovedQuotations = quotationData.some(item => item.status === "Approved");

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openDetailsModal = (quotation: QuotationData) => {
    setSelectedQuotation(quotation);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedQuotation(null);
  };

  // Function to navigate to checkout page
  const goToCheckout = () => {
    window.location.href = `/checkoutpage`;
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <SupabaseDebugger />
      {/* Page Header Section */}
      <div className="col-span-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[#0D47A1] dark:text-white/90">
            Quotation Management
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            {hasApprovedQuotations && (
              <Button 
                variant="primary" 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={goToCheckout}
              >
                Pay Now
              </Button>
            )}
            <Button 
              variant="primary" 
              size="sm" 
              className="bg-[#1E88E5] hover:bg-[#0D47A1]"
              onClick={openModal}
            >
              Create New Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Quotation Summary Cards */}
      <div className="col-span-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {/* Total Quotes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <svg className="text-[#0D47A1]" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total Quotes
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                {metrics.total}
              </h4>
            </div>
          </div>

          {/* Approved Quotes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <svg className="text-[#0D47A1]" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Approved Quotes
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                {metrics.approved}
              </h4>
            </div>
          </div>

          {/* Pending Quotes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <svg className="text-[#0D47A1]" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Pending Quotes
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                {metrics.pending}
              </h4>
            </div>
          </div>

          {/* Rejected Quotes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <svg className="text-[#0D47A1]" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Rejected Quotes
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                {metrics.rejected}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Table Section */}
      <div className="col-span-12">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
            <h3 className="font-semibold text-[#0D47A1] text-base dark:text-white/90">
              Recent Quotations
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search quotations..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-[#1E88E5] w-64 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
                <svg
                  className="absolute left-3 top-2.5 text-gray-400"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 21L16.65 16.65"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
            <div className="min-w-full">
              <Table>
                {/* Table Header */}
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      ID
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Product
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Quantity
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Price
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {isLoading && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-gray-500 text-center">
                        <div className="w-full text-center">Loading quotations...</div>
                      </TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                    </TableRow>
                  )}
                  
                  {!isLoading && quotationData.length === 0 && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-gray-500 text-center">
                        <div className="w-full text-center">No quotations found</div>
                      </TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                      <TableCell>{""}</TableCell>
                    </TableRow>
                  )}
                  
                  {!isLoading && quotationData.map((item) => (
                    <TableRow 
                      key={item.id}
                      className="transition-all duration-300 hover:bg-[#E3F2FD] hover:shadow-md cursor-pointer transform hover:translate-x-1 hover:scale-[1.01]"
                    >
                      <TableCell className="px-5 py-4 text-gray-700 text-start text-theme-sm dark:text-white/90">
                        {item.quotation_id}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-lg relative">
                            {item.hasImage ? (
                              <Image
                                width={40}
                                height={40}
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                No image
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {item.product.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-700 text-start text-theme-sm dark:text-white/90">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-700 text-start text-theme-sm dark:text-white/90">
                        {item.date}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <Badge
                          size="sm"
                          color={
                            item.status === "Approved"
                              ? "success"
                              : item.status === "Pending"
                              ? "warning"
                              : "error"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-700 text-start text-theme-sm dark:text-white/90">
                        {item.status === "Pending" && (!item.priceOptions || item.priceOptions.length === 0) 
                          ? <span className="text-yellow-600 dark:text-yellow-400">Waiting for prices from supplier</span>
                          : item.price || (item.priceOptions && item.priceOptions.length > 0 
                              ? `${item.priceOptions.length} options available` 
                              : "-")}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex gap-2">
                          <button 
                            className="px-3 py-1 text-xs font-medium rounded-md bg-[#1E88E5] text-white hover:bg-[#0D47A1]"
                            onClick={() => openDetailsModal(item)}
                          >
                            Details
                          </button>
                          {item.status === "Approved" && (
                            <button 
                              className="px-3 py-1 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
                              onClick={() => {
                                window.location.href = `/checkoutpage?quotation=${item.id}`;
                              }}
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between p-5 border-t border-gray-100 dark:border-white/[0.05]">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing 1-{quotationData.length} of {metrics.total} items
            </div>
            <div className="flex gap-1">
              <button className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-[#E3F2FD] hover:text-[#1E88E5] disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-white/[0.05]" disabled>
                Previous
              </button>
              <button className="px-3 py-1 text-sm rounded-md bg-[#1E88E5] text-white">
                1
              </button>
              <button className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-[#E3F2FD] hover:text-[#1E88E5] dark:border-gray-700 dark:hover:bg-white/[0.05]">
                2
              </button>
              <button className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-[#E3F2FD] hover:text-[#1E88E5] dark:border-gray-700 dark:hover:bg-white/[0.05]">
                3
              </button>
              <button className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-[#E3F2FD] hover:text-[#1E88E5] dark:border-gray-700 dark:hover:bg-white/[0.05]">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Form Modal */}
      <QuotationFormModal isOpen={isModalOpen} onClose={closeModal} />

      {/* Quotation Details Modal */}
      {selectedQuotation && (
        <QuotationDetailsModal 
          isOpen={isDetailsModalOpen} 
          onClose={closeDetailsModal}
          quotation={selectedQuotation}
        />
      )}
    </div>
  );
} 
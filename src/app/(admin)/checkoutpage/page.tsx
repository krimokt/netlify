"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

interface PriceOption {
  id: string;
  name: string;
  price: string;
  supplier: string;
  deliveryTime: string;
  description: string;
  modelName?: string;
  modelImage?: string;
}

interface QuotationData {
  id: string;
  uuid?: string; // Internal database UUID
  product: {
    name: string;
    image: string;
    category: string;
    description?: string;
  };
  quantity: string;
  date: string;
  status: string;
  price?: string;
  shippingMethod: string;
  destination: string;
  priceOptions?: PriceOption[];
  selectedOption?: string;
  hasImage?: boolean;
}

// Component specifically for handling search params
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const quotationId = searchParams.get("quotation");
  const router = useRouter();
  return { quotationId, router };
}

// Component to handle main content
function CheckoutContent({ quotationId, router }: { quotationId: string | null, router: ReturnType<typeof useRouter> }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [approvedQuotations, setApprovedQuotations] = useState<QuotationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [pendingPriceSelections, setPendingPriceSelections] = useState<Record<string, string>>({});
  const [showPendingSelectionModal, setShowPendingSelectionModal] = useState(false);
  const [currentPendingQuotation, setCurrentPendingQuotation] = useState<QuotationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentProcessingModalOpen, setIsPaymentProcessingModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'processing'>('processing');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch approved quotations, price options, and user selections
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Authentication error. Please log in again.");
          return;
        }
        
        const userId = session?.user?.id;
        
        if (!userId) {
          setError("You need to be logged in to view the checkout page.");
          return;
        }
        
        // Fetch all approved quotations
        const { data: quotationsData, error: quotationsError } = await supabase
          .from('quotations')
          .select('id, quotation_id, product_name, quantity, created_at, status, shipping_method, destination_country, destination_city, product_images, service_type, alibaba_url')
          .eq('status', 'Approved');
          
        if (quotationsError) {
          console.error("Error fetching quotations:", quotationsError);
          setError("Failed to load quotations. Please try again.");
          return;
        }
        
        // Fetch all price options
        const { data: priceOptionsData, error: priceOptionsError } = await supabase
          .from('price_options')
          .select('*');
          
        if (priceOptionsError) {
          console.error("Error fetching price options:", priceOptionsError);
          setError("Failed to load price options. Please try again.");
        }
        
        // Fetch user selections
        const { data: userSelectionsData, error: userSelectionsError } = await supabase
          .from('user_selections')
          .select('quotation_id, option_id')
          .eq('user_id', userId);
          
        if (userSelectionsError) {
          console.error("Error fetching user selections:", userSelectionsError);
        }
        
        // Create maps for price options and user selections
        const priceOptionsMap = new Map();
        if (priceOptionsData) {
          priceOptionsData.forEach(option => {
            if (!priceOptionsMap.has(option.quotation_ref_id)) {
              priceOptionsMap.set(option.quotation_ref_id, []);
            }
            priceOptionsMap.get(option.quotation_ref_id).push({
              id: option.id,
              price: `$${parseFloat(option.price).toLocaleString()}`,
              supplier: option.supplier,
              deliveryTime: option.delivery_time,
              description: option.description,
              modelName: option.name,
              modelImage: option.image || "/images/product/product-01.jpg"
            });
          });
        }
        
        // Create map for user selections
        const userSelectionsMap = new Map();
        if (userSelectionsData) {
          userSelectionsData.forEach(selection => {
            userSelectionsMap.set(selection.quotation_id, selection.option_id);
          });
        }
        
        // Transform data to match the format expected by the component
        const formattedData = quotationsData.map(item => {
          // Handle image URL
          let imageUrl = "/images/product/product-01.jpg"; // Default fallback image
          let hasValidImage = false;
          
          if (item.product_images && item.product_images.length > 0) {
            const rawImageUrl = item.product_images[0];
            
            if (rawImageUrl) {
              try {
                if (rawImageUrl.startsWith('/')) {
                  imageUrl = rawImageUrl;
                  hasValidImage = true;
                } 
                else if (rawImageUrl.includes('supabase.co/storage/v1/object/public')) {
                  imageUrl = rawImageUrl;
                  hasValidImage = true;
                }
                else if (!rawImageUrl.includes('://') && !rawImageUrl.startsWith('/')) {
                  imageUrl = `https://cfhochnjniddaztgwrbk.supabase.co/storage/v1/object/public/quotation-images/product-images/${rawImageUrl}`;
                  hasValidImage = true;
                }
                else if ((rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://'))) {
                  imageUrl = rawImageUrl;
                  hasValidImage = true;
                }
              } catch {
                console.warn("Invalid image URL:", rawImageUrl);
                imageUrl = "/images/product/product-01.jpg";
                hasValidImage = false;
              }
            }
          }
          
          // Get price options for this quotation
          const priceOptions = priceOptionsMap.get(item.id) || [];
          
          // Get selected option for this quotation
          const selectedOption = userSelectionsMap.get(item.id);
          
          // Calculate price based on selected option or average of options
          let price;
          if (selectedOption) {
            const option = priceOptions.find((opt: PriceOption) => opt.id === selectedOption);
            price = option ? option.price : undefined;
          } else if (priceOptions.length > 0) {
            const average = priceOptions.reduce((sum: number, option: PriceOption) => {
              const numericPrice = parseFloat(option.price.replace(/[$,]/g, ''));
              return sum + numericPrice;
            }, 0) / priceOptions.length;
            price = `$${average.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
          
          return {
            id: item.quotation_id || `QT-${item.id}`,
            uuid: item.id, // Keep internal UUID for database operations
            product: {
              name: item.product_name,
              image: imageUrl,
              category: item.service_type || "Uncategorized",
              description: item.alibaba_url ? `Reference URL: ${item.alibaba_url}` : undefined
            },
            quantity: `${item.quantity} units`,
            date: new Date(item.created_at).toLocaleDateString(),
            status: item.status,
            price: price,
            shippingMethod: item.shipping_method || "Sea Freight",
            destination: `${item.destination_city || ""}, ${item.destination_country || ""}`.trim().replace(/^,\s*/, ""),
            priceOptions: priceOptions,
            selectedOption: selectedOption,
            hasImage: hasValidImage
          };
        });
        
        setApprovedQuotations(formattedData);
        
        // Pre-select quotation if provided in URL
        if (quotationId) {
          setSelectedQuotations([quotationId]);
        }

        // Create initial pending selections state
        const initialPendingSelections: Record<string, string> = {};
        formattedData.forEach(quotation => {
          if (quotation.selectedOption) {
            initialPendingSelections[quotation.id] = quotation.selectedOption;
          }
        });
        setPendingPriceSelections(initialPendingSelections);
        
      } catch (error) {
        console.error("Exception fetching data:", error);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [quotationId, supabase]);

  const calculateTotal = () => {
    return selectedQuotations.reduce((total, quotationId) => {
      const quotation = approvedQuotations.find(q => q.id === quotationId);
      if (!quotation) return total;
      
      // If there's a pending selection that differs from the saved selection
      const selectedOptionId = pendingPriceSelections[quotationId] || quotation.selectedOption;
      
      if (selectedOptionId && quotation.priceOptions) {
        const selectedOption = quotation.priceOptions.find(opt => opt.id === selectedOptionId);
        if (selectedOption) {
          // Extract numeric value from price string (e.g., "$15,000" -> 15000)
          const priceValue = parseFloat(selectedOption.price.replace(/[$,]/g, ''));
          return total + priceValue;
        }
      }
      
      // Fallback to quotation price if no option is selected
      if (quotation.price) {
        const priceValue = parseFloat(quotation.price.replace(/[$,]/g, ''));
        return total + priceValue;
      }
      
      return total;
      }, 0);
  };

  const handleQuotationSelection = (id: string) => {
    setSelectedQuotations(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handlePriceOptionSelection = (quotationId: string, optionId: string) => {
    setPendingPriceSelections(prev => ({
      ...prev,
      [quotationId]: optionId
    }));
  };

  const handleSavePriceSelection = async () => {
    if (!currentPendingQuotation || !pendingPriceSelections[currentPendingQuotation.id]) {
      return;
    }
    
    try {
      const quotationId = currentPendingQuotation.uuid || currentPendingQuotation.id;
      const optionId = pendingPriceSelections[currentPendingQuotation.id];
      
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        alert("You need to be logged in to save selections.");
        return;
      }

      // Check if a selection already exists
      const { data: existingData, error: existingError } = await supabase
        .from('user_selections')
        .select('id')
        .eq('quotation_id', quotationId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingError) {
        console.error("Error checking existing selection:", existingError);
        alert("Failed to save your selection. Please try again.");
        return;
      }
      
      let result;
      
      // If selection exists, update it
      if (existingData?.id) {
        result = await supabase
          .from('user_selections')
          .update({
            option_id: optionId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
      } 
      // Otherwise create a new selection
      else {
        result = await supabase
          .from('user_selections')
          .insert({
            quotation_id: quotationId,
            option_id: optionId,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      if (result.error) {
        console.error("Error saving selection:", result.error);
        alert("Failed to save your selection. Please try again.");
        return;
      }
      
      // Update local state
      const updatedQuotations = approvedQuotations.map(quotation => {
        if (quotation.id === currentPendingQuotation.id) {
          return {
            ...quotation,
            selectedOption: optionId
          };
        }
        return quotation;
      });
      
      setApprovedQuotations(updatedQuotations);
      setShowPendingSelectionModal(false);
      setCurrentPendingQuotation(null);
      
    } catch (error) {
      console.error("Exception saving selection:", error);
      alert("Failed to save your selection. Please try again.");
    }
  };

  const handleBankSelection = (bank: string) => {
    setSelectedBank(bank);
  };

  const handleCompletePayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');
      setIsPaymentProcessingModalOpen(true);
      
      // Simulate payment processing
      setTimeout(async () => {
        try {
          // Create payment records in Supabase
          for (const quotationId of selectedQuotations) {
            const quotation = approvedQuotations.find(q => q.id === quotationId);
            const selectedOptionId = pendingPriceSelections[quotationId] || '';
            
            if (quotation) {
              const { error } = await supabase
                .from('payments')
                .insert({
                  user_id: (await supabase.auth.getUser()).data.user?.id,
                  quotation_id: quotationId,
                  amount: selectedOptionId ? 
                    parseFloat((quotation.priceOptions?.find(opt => opt.id === selectedOptionId)?.price || '0')
                      .replace(/[$,]/g, '')) : 0,
                  status: 'pending',
                  payment_method: selectedBank || 'bank_transfer',
                  created_at: new Date().toISOString()
                });
                
              if (error) {
                console.error("Error creating payment record:", error);
                setPaymentStatus('failed');
                setIsProcessing(false);
                return;
              }
            }
          }
          
          // If we get here, payment was successful
          setPaymentStatus('success');
          setIsProcessing(false);
          
          // Clear selected quotations after successful payment
          setSelectedQuotations([]);
        } catch (error) {
          console.error("Payment processing error:", error);
          setPaymentStatus('failed');
          setIsProcessing(false);
        }
      }, 2000); // Simulate 2 second processing time
      
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus('failed');
      setIsProcessing(false);
    }
  };

  const selectAllWithPendingPrice = () => {
    const quotationsWithSelections = approvedQuotations.filter(quotation => 
      quotation.selectedOption || pendingPriceSelections[quotation.id]
    );
    setSelectedQuotations(quotationsWithSelections.map(quotation => quotation.id));
  };

  const closePaymentProcessingModal = () => {
    setIsPaymentProcessingModalOpen(false);
    if (paymentStatus === 'success') {
      // Optionally redirect to payment history page
      router.push('/payment');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mx-auto my-8 max-w-3xl">
        <h2 className="text-red-700 font-semibold text-lg mb-3">Error</h2>
        <p className="text-red-600">{error}</p>
        <Button
          variant="primary"
          className="mt-4 bg-red-600 hover:bg-red-700"
          onClick={() => window.location.href = '/quotation'}
        >
          Back to Quotations
        </Button>
      </div>
    );
  }

  // No approved quotations
  if (approvedQuotations.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mx-auto my-8 max-w-3xl">
        <h2 className="text-blue-700 font-semibold text-lg mb-3">No Approved Quotations</h2>
        <p className="text-blue-600">You don&apos;t have any approved quotations to checkout.</p>
        <Button
          variant="primary"
          className="mt-4 bg-blue-600 hover:bg-blue-700"
          onClick={() => window.location.href = '/quotation'}
        >
          View All Quotations
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header Section */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#0D47A1] dark:text-white/90">
            Checkout
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/quotation">
              <Button variant="outline" size="sm" className="text-[#1E88E5] border-[#64B5F6] hover:bg-[#E3F2FD]">
                Quotations
              </Button>
            </Link>
            <Link href="/payment">
              <Button variant="primary" size="sm" className="bg-[#1E88E5] hover:bg-[#0D47A1] text-white">
                Payment History
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quotations Section - Left Side */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Your Quotations</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm"
                    onClick={selectAllWithPendingPrice}
                  >
                    Select All
                  </Button>
                  <Link href="/quotation">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-sm"
                    >
                      Add More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Quotation Items */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {approvedQuotations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No items in checkout</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">You don&apos;t have any approved quotations to checkout.</p>
                  <Link href="/quotation">
                    <Button variant="primary" className="bg-blue-600 hover:bg-blue-700">
                      View Quotations
                    </Button>
                  </Link>
                </div>
              ) : (
                approvedQuotations.map((quotation) => (
                  <div 
                    key={quotation.id}
                    className={`transition-colors duration-200 ${
                      selectedQuotations.includes(quotation.id) 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    } ${
                      quotation.priceOptions && quotation.priceOptions.length > 0 && 
                      !quotation.selectedOption && !pendingPriceSelections[quotation.id]
                      ? 'border-l-4 border-yellow-400'
                      : ''
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start">
                        <div className="mr-4 pt-1">
                          <input 
                            type="checkbox"
                            checked={selectedQuotations.includes(quotation.id)}
                            onChange={() => handleQuotationSelection(quotation.id)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 relative rounded-lg overflow-hidden">
                                {quotation.hasImage ? (
                                  <Image
                                    src={quotation.product.image}
                                    alt={quotation.product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                    No image
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Product Details */}
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row justify-between">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-medium text-gray-900 dark:text-white">{quotation.product.name}</h3>
                                    <Badge size="sm" color="success">{quotation.status}</Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="inline-flex items-center">
                                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                      </svg>
                                      ID: {quotation.id}
                                    </span>
                                    <span className="inline-flex items-center">
                                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      Quantity: {quotation.quantity}
                                    </span>
                                    <span className="inline-flex items-center">
                                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      Date: {quotation.date}
                                    </span>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 inline-flex items-center">
                                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    Shipping: {quotation.shippingMethod} to {quotation.destination}
                                  </div>
                                </div>
                                
                                {/* Price Info */}
                                <div className="mt-3 sm:mt-0 text-right">
                                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                                    {(() => {
                                      // Use selected or pending option price
                                      const optionId = pendingPriceSelections[quotation.id] || quotation.selectedOption;
                                      if (optionId && quotation.priceOptions) {
                                        const option = quotation.priceOptions.find(opt => opt.id === optionId);
                                        if (option) return option.price;
                                      }
                                      return quotation.price || 'Price not set';
                                    })()}
                                  </div>
                                  {quotation.priceOptions && quotation.priceOptions.length > 0 && (
                                    <div className="mt-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-sm text-blue-600 dark:text-blue-400"
                                        onClick={() => {
                                          setCurrentPendingQuotation(quotation);
                                          setShowPendingSelectionModal(true);
                                        }}
                                      >
                                        {quotation.selectedOption || pendingPriceSelections[quotation.id] 
                                          ? "Change Option" 
                                          : "Select Option"
                                        }
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Order Summary Section - Right Side */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Order Summary</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">${calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="font-medium text-gray-900 dark:text-white">Included</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="font-medium text-gray-900 dark:text-white">$0.00</span>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-xl text-[#0D47A1] dark:text-blue-400">${calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Select Payment Method</h3>
                <div className="space-y-3">
                  {['WISE BANK', 'SOCIETE GENERALE BANK', 'CIH BANK', 'PAYONEER BANK'].map((bank) => (
                    <div 
                      key={bank}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedBank === bank 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                      onClick={() => handleBankSelection(bank)}
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedBank === bank 
                              ? 'border-blue-500' 
                              : 'border-gray-400'
                          }`}>
                            {selectedBank === bank && (
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            )}
                          </div>
                        </div>
                        <div className="font-medium">{bank}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <Button
                    variant="outline"
                    className="w-full text-[#1E88E5] border-[#64B5F6] hover:bg-[#E3F2FD]"
                    onClick={() => router.push("/quotation")}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Continue Shopping
                  </Button>
                  <Button
                    className="w-full bg-[#1E88E5] hover:bg-[#0D47A1] text-white"
                    onClick={handleCompletePayment}
                    disabled={isProcessing || selectedQuotations.length === 0}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Complete Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Selection Modal - Simplified */}
      <Modal
        isOpen={showPendingSelectionModal && currentPendingQuotation !== null}
        onClose={() => setShowPendingSelectionModal(false)}
        showCloseButton={true}
        className="max-w-md mx-auto"
      >
        {currentPendingQuotation && (
          <div className="p-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Select Price Option
            </h2>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Product: <span className="font-medium text-gray-700 dark:text-white">{currentPendingQuotation.product.name}</span>
            </div>

            <div className="space-y-3 mb-5">
              {currentPendingQuotation.priceOptions?.map((option) => (
                <div 
                  key={option.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    pendingPriceSelections[currentPendingQuotation.id] === option.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handlePriceOptionSelection(currentPendingQuotation.id, option.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${pendingPriceSelections[currentPendingQuotation.id] === option.id ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        {option.supplier || 'Supplier'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-5">
                        Delivery: {option.deliveryTime}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white">{option.price}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPendingSelectionModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#1E88E5] hover:bg-[#0D47A1] text-white"
                onClick={handleSavePriceSelection}
                disabled={!pendingPriceSelections[currentPendingQuotation.id]}
              >
                Save Selection
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Processing Modal */}
      <Modal
        isOpen={isPaymentProcessingModalOpen}
        onClose={() => { if (!isProcessing) closePaymentProcessingModal(); }}
        showCloseButton={!isProcessing}
        className="max-w-md mx-auto"
      >
        <div className="p-6 text-center">
          {isProcessing ? (
            <>
              <div className="w-16 h-16 border-4 border-t-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">
                Processing Payment
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we process your payment...
              </p>
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">
                Payment Successful
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your payment has been processed successfully.
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={closePaymentProcessingModal}
                >
                  Close
                </Button>
                <Link href="/payment">
                  <Button
                    size="sm"
                    className="bg-[#1E88E5] hover:bg-[#0D47A1] text-white"
                  >
                    View Payment History
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">
                Payment Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                There was an issue processing your payment. Please try again.
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={closePaymentProcessingModal}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1E88E5] hover:bg-[#0D47A1] text-white"
                  onClick={handleCompletePayment}
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

// Main component with Suspense boundary using a specialized approach for Next.js 15
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout page...</p>
        </div>
      </div>
    }>
      <SearchParamsWrapper />
    </Suspense>
  );
}

// Component that handles the search params and renders the main content
function SearchParamsWrapper() {
  const { quotationId, router } = SearchParamsHandler();
  return <CheckoutContent quotationId={quotationId} router={router} />;
} 
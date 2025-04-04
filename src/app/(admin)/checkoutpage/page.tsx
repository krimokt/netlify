"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";

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
  product: {
    name: string;
    image: string;
    category: string;
    description: string;
  };
  quantity: string;
  date: string;
  status: string;
  price?: string;
  shippingMethod: string;
  destination: string;
  priceOptions?: PriceOption[];
  selectedOption?: string;
}

// Sample product images
const productImages = [
  "/images/product/product-01.jpg",
  "/images/product/product-02.jpg",
  "/images/product/product-03.jpg",
  "/images/product/product-04.jpg",
  "/images/product/product-05.jpg",
];

// Sample approved quotations
const approvedQuotations: QuotationData[] = [
  {
    id: "QT-2024-003",
    product: {
      name: "Electric Motors",
      image: productImages[2],
      category: "Electrical Components",
      description: "High-efficiency electric motors for various industrial applications."
    },
    quantity: "30 units",
    date: "2024-03-15",
    status: "Approved",
    price: "USD 15,200",
    shippingMethod: "Sea Freight",
    destination: "New York, USA",
    priceOptions: [
      { 
        id: "standard", 
        price: "USD 13,000", 
        supplier: "Standard Supplier", 
        deliveryTime: "4-6 weeks",
        description: "Standard model with basic features",
        modelName: "Standard Model",
        modelImage: productImages[0]
      },
      { 
        id: "premium", 
        price: "USD 15,000", 
        supplier: "Premium Supplier Co.", 
        deliveryTime: "3-5 weeks",
        description: "Premium model with optimizers for better performance",
        modelName: "Premium Model with Optimizers",
        modelImage: productImages[1]
      },
      { 
        id: "premium-warranty", 
        price: "USD 16,500", 
        supplier: "Premium Supplier Co.", 
        deliveryTime: "3-5 weeks",
        description: "Premium model with extended warranty and priority support",
        modelName: "Premium Model with Extended Warranty",
        modelImage: productImages[2]
      }
    ],
    selectedOption: "premium"
  },
  {
    id: "QT-2024-006",
    product: {
      name: "Solar Panel System",
      image: productImages[3],
      category: "Renewable Energy",
      description: "Complete solar panel system with inverters and mounting hardware."
    },
    quantity: "10 units",
    date: "2024-03-18",
    status: "Approved",
    price: "USD 24,500",
    shippingMethod: "Sea Freight",
    destination: "Dubai, UAE",
    priceOptions: [
      { 
        id: "basic", 
        price: "USD 22,000", 
        supplier: "Solar Solutions Inc.", 
        deliveryTime: "5-7 weeks",
        description: "Basic system with standard efficiency panels",
        modelName: "Basic Solar System",
        modelImage: productImages[3]
      },
      { 
        id: "advanced", 
        price: "USD 24,500", 
        supplier: "SunPower Technologies", 
        deliveryTime: "4-6 weeks",
        description: "Advanced system with high-efficiency panels and smart monitoring",
        modelName: "Advanced Solar System",
        modelImage: productImages[3]
      }
    ],
    selectedOption: "advanced"
  },
  {
    id: "QT-2024-008",
    product: {
      name: "Industrial Air Compressor",
      image: productImages[4],
      category: "Industrial Equipment",
      description: "High-capacity industrial air compressor with filtration system."
    },
    quantity: "5 units",
    date: "2024-03-22",
    status: "Approved",
    price: "USD 8,700",
    shippingMethod: "Air Freight",
    destination: "Sydney, Australia",
    priceOptions: [
      { 
        id: "standard", 
        price: "USD 7,800", 
        supplier: "CompAir Industries", 
        deliveryTime: "3-4 weeks",
        description: "Standard model with 75 HP motor",
        modelName: "Standard Compressor",
        modelImage: productImages[4]
      },
      { 
        id: "heavy-duty", 
        price: "USD 8,700", 
        supplier: "Atlas Pneumatics", 
        deliveryTime: "2-3 weeks",
        description: "Heavy-duty model with 100 HP motor and advanced cooling system",
        modelName: "Heavy-Duty Compressor",
        modelImage: productImages[4]
      }
    ],
    selectedOption: "heavy-duty"
  }
];

// Add this additional sample data with approved quotations without price options selected
const approvedQuotationsWithoutSelection: QuotationData[] = [
  {
    id: "QT-2024-007",
    product: {
      name: "Industrial Control Panel",
      image: productImages[1],
      category: "Automation Systems",
      description: "Industrial control panel for manufacturing automation."
    },
    quantity: "3 units",
    date: "2024-03-20",
    status: "Approved",
    price: "USD 6,500",
    shippingMethod: "Air Freight",
    destination: "Toronto, Canada",
    priceOptions: [
      { 
        id: "basic", 
        price: "USD 5,800", 
        supplier: "AutoControl Inc.", 
        deliveryTime: "2-3 weeks",
        description: "Basic model with standard features",
        modelName: "Basic Control Panel",
        modelImage: productImages[1]
      },
      { 
        id: "advanced", 
        price: "USD 6,500", 
        supplier: "Premium Automation", 
        deliveryTime: "1-2 weeks",
        description: "Advanced model with touchscreen interface",
        modelName: "Premium Control Panel",
        modelImage: productImages[1]
      }
    ]
  },
  {
    id: "QT-2024-009",
    product: {
      name: "Commercial HVAC System",
      image: productImages[0],
      category: "Climate Control",
      description: "High-efficiency commercial HVAC system."
    },
    quantity: "1 unit",
    date: "2024-03-23",
    status: "Approved",
    price: "USD 12,300",
    shippingMethod: "Sea Freight",
    destination: "Singapore",
    priceOptions: [
      { 
        id: "standard", 
        price: "USD 11,200", 
        supplier: "Climate Tech Ltd.", 
        deliveryTime: "5-6 weeks",
        description: "Standard energy efficiency",
        modelName: "Standard HVAC System",
        modelImage: productImages[0]
      },
      { 
        id: "premium", 
        price: "USD 12,300", 
        supplier: "EcoClimate Solutions", 
        deliveryTime: "4-5 weeks",
        description: "Premium energy efficiency with smart controls",
        modelName: "Premium HVAC System",
        modelImage: productImages[0]
      }
    ]
  }
];

const CheckoutPage = () => {
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [pendingPriceSelections, setPendingPriceSelections] = useState<Record<string, string>>({});
  const [showPendingSelectionModal, setShowPendingSelectionModal] = useState(false);
  const [currentPendingQuotation, setCurrentPendingQuotation] = useState<QuotationData | null>(null);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'pending' | 'approved' | 'rejected'>('processing');

  // Get all quotations including those without selections
  const allApprovedQuotations = [...approvedQuotations, ...approvedQuotationsWithoutSelection];

  // On page load, parse URL for quotation ID from QuotationDetailsModal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quotationId = params.get('quotation');
    if (quotationId) {
      setSelectedQuotations([quotationId]);
    }

    // Initialize pending selections
    const pending: Record<string, string> = {};
    approvedQuotationsWithoutSelection.forEach(quotation => {
      if (quotation.priceOptions && quotation.priceOptions.length > 0) {
        pending[quotation.id] = "";
      }
    });
    setPendingPriceSelections(pending);
  }, []);
  
  // Count quotations that need price selection
  const quotationsNeedingSelectionCount = Object.keys(pendingPriceSelections).filter(id => 
    pendingPriceSelections[id] === ""
  ).length;

  // Calculate total price
  const calculateTotal = () => {
    return allApprovedQuotations
      .filter(q => selectedQuotations.includes(q.id))
      .reduce((total, quotation) => {
        const option = quotation.priceOptions?.find(opt => {
          // Check if it's in the pending selections
          if (pendingPriceSelections[quotation.id]) {
            return opt.id === pendingPriceSelections[quotation.id];
          }
          // Or use the selectedOption from the quotation
          return opt.id === quotation.selectedOption;
        });
        const price = option ? option.price : quotation.price || "0";
        const numericPrice = parseFloat(price.replace(/[^\d.]/g, ''));
        return total + numericPrice;
      }, 0);
  };

  const handleQuotationSelection = (id: string) => {
    // If quotation needs selection and not yet selected price, show modal
    const quotation = approvedQuotationsWithoutSelection.find(q => q.id === id);
    if (quotation && pendingPriceSelections[id] === "") {
      setCurrentPendingQuotation(quotation);
      setShowPendingSelectionModal(true);
      return;
    }

    setSelectedQuotations(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id) 
        : [...prev, id]
    );
  };

  const handlePriceOptionSelection = (quotationId: string, optionId: string) => {
    setPendingPriceSelections(prev => ({
      ...prev,
      [quotationId]: optionId
    }));
  };

  const handleSavePriceSelection = () => {
    if (currentPendingQuotation && pendingPriceSelections[currentPendingQuotation.id]) {
      // Add to selected quotations after price selection
      setSelectedQuotations(prev => [...prev, currentPendingQuotation.id]);
      setShowPendingSelectionModal(false);
      setCurrentPendingQuotation(null);
    }
  };

  const handleBankSelection = (bank: string) => {
    setSelectedBank(bank);
  };

  const handleCompletePayment = () => {
    // Check if any selected quotations need price selection
    const hasIncompleteSelections = selectedQuotations.some(id => 
      pendingPriceSelections[id] === ""
    );

    if (hasIncompleteSelections) {
      alert('Please select price options for all selected quotations before proceeding.');
      return;
    }

    // Show processing modal
    setProcessingStatus('processing');
    setShowProcessingModal(true);

    // Simulate API call with a longer processing time
    setTimeout(() => {
      // Update the processing status
      setProcessingStatus('pending');
    }, 3000); // Extended from 2000ms to 3000ms for more visibility
  };

  // Function to close modal without redirecting
  const closeProcessingModal = () => {
    setShowProcessingModal(false);
  };

  const selectAllWithPendingPrice = () => {
    // Find quotations that need price selection and have not been selected yet
    const quotationsNeedingSelection = approvedQuotationsWithoutSelection
      .filter(q => pendingPriceSelections[q.id] === "")
      .map(q => q.id);
    
    if (quotationsNeedingSelection.length > 0) {
      // Show first quotation for selection
      const firstQuotation = approvedQuotationsWithoutSelection.find(q => q.id === quotationsNeedingSelection[0]);
      if (firstQuotation) {
        setCurrentPendingQuotation(firstQuotation);
        setShowPendingSelectionModal(true);
      }
    }
  };

  return (
    <>
      <div className="container mx-auto max-w-7xl px-4 md:px-6 pt-8 pb-12">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center mb-2">
              <button 
                onClick={() => window.location.href = "/quotation"}
                className="inline-flex items-center mr-3 text-blue-600 hover:text-blue-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Quotations
              </button>
            </div>
            <h2 className="text-title-md2 font-bold text-black dark:text-white">
              Checkout
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pay for your approved quotations
            </p>
          </div>
        </div>

        {/* Quick Action Banner for Quotations Needing Price Selection */}
        {quotationsNeedingSelectionCount > 0 && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-3 sm:mb-0">
                <h3 className="font-medium text-blue-800 dark:text-blue-300">
                  You have {quotationsNeedingSelectionCount} approved quotation{quotationsNeedingSelectionCount !== 1 ? 's' : ''} without price selection
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Select price options to include them in your payment and save on transaction fees
                </p>
              </div>
              <button
                onClick={selectAllWithPendingPrice}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Select Price Options
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Quotations List */}
          <div className="col-span-1 lg:col-span-8">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="max-w-full overflow-x-auto">
                <div className="p-4 border-b border-stroke dark:border-strokedark">
                  <h3 className="font-semibold text-black dark:text-white">
                    Approved Quotations
                  </h3>
                </div>

                {allApprovedQuotations.length > 0 ? (
                  <>
                    {/* Quotations with Selected Price Options */}
                    {approvedQuotations.map((quotation) => (
                      <div 
                        key={quotation.id}
                        className={`p-4 border-b border-stroke dark:border-strokedark flex items-start gap-4 ${
                          selectedQuotations.includes(quotation.id) 
                            ? 'bg-blue-50 dark:bg-blue-900/10' 
                            : ''
                        }`}
                      >
                        <div className="flex-shrink-0 pt-1">
                          <input 
                            type="checkbox"
                            checked={selectedQuotations.includes(quotation.id)}
                            onChange={() => handleQuotationSelection(quotation.id)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="flex-1 flex flex-col sm:flex-row">
                          <div className="w-full sm:w-1/4 mb-3 sm:mb-0 flex-shrink-0">
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <Image
                                src={quotation.product.image}
                                alt={quotation.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                          
                          <div className="flex-1 sm:ml-4">
                            <div className="flex flex-wrap justify-between mb-2">
                              <h4 className="text-lg font-semibold text-black dark:text-white">
                                {quotation.product.name}
                              </h4>
                              <Badge size="sm" color="success">Approved</Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-3">
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Quotation ID:</span>
                                <span className="ml-2 text-sm font-medium">{quotation.id}</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Date:</span>
                                <span className="ml-2 text-sm font-medium">{quotation.date}</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Quantity:</span>
                                <span className="ml-2 text-sm font-medium">{quotation.quantity}</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Shipping:</span>
                                <span className="ml-2 text-sm font-medium">{quotation.shippingMethod}</span>
                              </div>
                            </div>
                            
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Selected Option:</p>
                              {quotation.selectedOption && quotation.priceOptions ? (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {quotation.priceOptions.find(opt => opt.id === quotation.selectedOption)?.modelName || "Selected Option"}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Supplier: {quotation.priceOptions.find(opt => opt.id === quotation.selectedOption)?.supplier}
                                    </p>
                                  </div>
                                  <p className="font-bold text-lg text-[#0D47A1] dark:text-blue-400 mt-2 sm:mt-0">
                                    {quotation.priceOptions.find(opt => opt.id === quotation.selectedOption)?.price || quotation.price}
                                  </p>
                                </div>
                              ) : (
                                <p className="font-bold text-[#0D47A1] dark:text-blue-400">{quotation.price}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Quotations Needing Price Selection */}
                    {approvedQuotationsWithoutSelection.map((quotation) => (
                      <div 
                        key={quotation.id}
                        className={`p-4 border-b border-stroke dark:border-strokedark flex items-start gap-4 ${
                          selectedQuotations.includes(quotation.id) 
                            ? 'bg-blue-50 dark:bg-blue-900/10' 
                            : pendingPriceSelections[quotation.id] === '' 
                              ? 'bg-yellow-50 dark:bg-yellow-900/10'
                              : ''
                        }`}
                      >
                        <div className="flex-shrink-0 pt-1">
                          <input 
                            type="checkbox"
                            checked={selectedQuotations.includes(quotation.id)}
                            onChange={() => handleQuotationSelection(quotation.id)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="flex-1 flex flex-col sm:flex-row">
                          <div className="w-full sm:w-1/4 mb-3 sm:mb-0 flex-shrink-0">
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <Image
                                src={quotation.product.image}
                                alt={quotation.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                          
                          <div className="flex-1 sm:ml-4">
                            <div className="flex flex-wrap justify-between mb-2">
                              <h4 className="text-lg font-semibold text-black dark:text-white">
                                {quotation.product.name}
                              </h4>
                              <div className="flex items-center">
                                <Badge size="sm" color="success">Approved</Badge>
                                {pendingPriceSelections[quotation.id] === '' && (
                                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                    Price Selection Required
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-3">
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Quotation ID:</span>
                                <span className="ml-2 text-sm font-medium">{quotation.id}</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Date:</span>
                                <span className="ml-2 text-sm font-medium">{quotation.date}</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Quantity:</span>
                                <span className="ml-2 text-sm font-medium">{quotation.quantity}</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Shipping:</span>
                                <span className="ml-2 text-sm font-medium">{quotation.shippingMethod}</span>
                              </div>
                            </div>
                            
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              {pendingPriceSelections[quotation.id] === '' ? (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                                    Please select a price option to proceed
                                  </p>
                                  <button
                                    onClick={() => {
                                      setCurrentPendingQuotation(quotation);
                                      setShowPendingSelectionModal(true);
                                    }}
                                    className="mt-2 sm:mt-0 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                  >
                                    Select Option
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {quotation.priceOptions?.find(opt => opt.id === pendingPriceSelections[quotation.id])?.modelName || "Selected Option"}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Supplier: {quotation.priceOptions?.find(opt => opt.id === pendingPriceSelections[quotation.id])?.supplier}
                                    </p>
                                  </div>
                                  <p className="font-bold text-lg text-[#0D47A1] dark:text-blue-400 mt-2 sm:mt-0">
                                    {quotation.priceOptions?.find(opt => opt.id === pendingPriceSelections[quotation.id])?.price || quotation.price}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No approved quotations found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-span-1 lg:col-span-4">
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h3 className="mb-4 font-semibold text-black dark:text-white">
                Order Summary
              </h3>
              
              <div className="mb-6 border-b border-stroke pb-6 dark:border-strokedark">
                <div className="mb-2 flex justify-between">
                  <p className="font-medium text-black dark:text-white">
                    Selected Items
                  </p>
                  <p className="font-medium text-black dark:text-white">
                    {selectedQuotations.length}
                  </p>
                </div>
                
                {selectedQuotations.map((id) => {
                  const quotation = allApprovedQuotations.find(q => q.id === id);
                  if (!quotation) return null;
                  
                  // Get price based on selection
                  let price;
                  if (pendingPriceSelections[id] && quotation.priceOptions) {
                    const option = quotation.priceOptions.find(opt => opt.id === pendingPriceSelections[id]);
                    price = option ? option.price : quotation.price;
                  } else if (quotation.selectedOption && quotation.priceOptions) {
                    const option = quotation.priceOptions.find(opt => opt.id === quotation.selectedOption);
                    price = option ? option.price : quotation.price;
                  } else {
                    price = quotation.price || "N/A";
                  }
                  
                  return (
                    <div key={id} className="mb-2 flex justify-between text-sm">
                      <p className="text-gray-500 dark:text-gray-400">
                        {quotation.product.name}
                      </p>
                      <p className="text-black dark:text-white">{price}</p>
                    </div>
                  );
                })}
              </div>
              
              <div className="mb-6">
                <div className="mb-2 flex justify-between">
                  <p className="font-medium text-black dark:text-white">
                    Total
                  </p>
                  <p className="font-bold text-xl text-black dark:text-white">
                    USD {calculateTotal().toLocaleString()}
                  </p>
                </div>
              </div>
              
              <Button
                variant="primary"
                className="w-full"
                disabled={selectedQuotations.length === 0 || !selectedBank}
                onClick={handleCompletePayment}
              >
                Complete Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Bank Payment Section */}
        <div className="mt-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4 font-semibold text-black dark:text-white">
              Payment Method
            </h3>

            <h4 className="font-medium mb-3 text-center">SELECT PAYMENT BANK</h4>
            
            {/* Bank Options */}
            <div className="space-y-4">
              {/* WISE BANK */}
              <div 
                className={`border rounded-lg overflow-hidden cursor-pointer ${
                  selectedBank === 'wise' ? 'border-blue-500 ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleBankSelection('wise')}
              >
                <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedBank === 'wise'}
                      onChange={() => handleBankSelection('wise')}
                      className="w-4 h-4 text-blue-600 border-gray-300"
                    />
                    <div className="ml-2 font-semibold">WISE BANK</div>
                  </div>
                </div>
                {selectedBank === 'wise' && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                        <p className="font-medium">Amadour Ltd</p>
                      </div>
                      <div className="flex items-center">
                        <button className="text-blue-500 ml-auto">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                            <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">IBAN</p>
                        <p className="font-medium flex items-center">
                          BE24 9052 0546 8538
                          <button className="text-blue-500 ml-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                            </svg>
                          </button>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Can receive EUR and other currencies</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">SWIFT/BIC</p>
                        <p className="font-medium flex items-center">
                          TRWIBEB1XXX
                          <button className="text-blue-500 ml-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                            </svg>
                          </button>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Only used for international Swift transfers</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Bank name and address</p>
                      <p className="font-medium">Wise, Rue du Trône 100, 3rd floor,</p>
                      <p className="font-medium">Brussels, 1050, Belgium</p>
                    </div>
                  </div>
                )}
              </div>

              {/* SOCIETE GENERALE BANK */}
              <div 
                className={`border rounded-lg overflow-hidden cursor-pointer ${
                  selectedBank === 'societe' ? 'border-blue-500 ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleBankSelection('societe')}
              >
                <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedBank === 'societe'}
                      onChange={() => handleBankSelection('societe')}
                      className="w-4 h-4 text-blue-600 border-gray-300"
                    />
                    <div className="ml-2 font-semibold">SOCIETE GENERALE BANK</div>
                  </div>
                </div>
                {selectedBank === 'societe' && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Nom titulaire</p>
                        <p className="font-medium">AMADOUR MEHDI</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Code SWIFT</p>
                        <p className="font-medium">SGMBMAMC</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Adresse agence</p>
                        <p className="font-medium">Société générale Maroc</p>
                        <p className="font-medium">LOTISSEMENT ONA 154 BOULEVARD AL QODS AIN CHOCK</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Agence</p>
                        <p className="font-medium">AL QODS OULAD TALEB</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      <div className="px-3 py-1 border rounded-md">
                        <p className="text-xs text-gray-500">Code banque</p>
                        <p className="font-medium text-center">022</p>
                      </div>
                      <div className="px-3 py-1 border rounded-md">
                        <p className="text-xs text-gray-500">Code ville</p>
                        <p className="font-medium text-center">780</p>
                      </div>
                      <div className="px-4 py-1 border rounded-md">
                        <p className="text-xs text-gray-500">Numéro du compte</p>
                        <p className="font-medium text-center">000359002837372</p>
                      </div>
                      <div className="px-3 py-1 border rounded-md">
                        <p className="text-xs text-gray-500">Clé RIB</p>
                        <p className="font-medium text-center">74</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Devise</p>
                      <p className="font-medium">MAD</p>
                    </div>
                  </div>
                )}
              </div>

              {/* CIH BANK */}
              <div 
                className={`border rounded-lg overflow-hidden cursor-pointer ${
                  selectedBank === 'cih' ? 'border-blue-500 ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleBankSelection('cih')}
              >
                <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedBank === 'cih'}
                      onChange={() => handleBankSelection('cih')}
                      className="w-4 h-4 text-blue-600 border-gray-300"
                    />
                    <div className="ml-2 font-semibold">CIH BANK</div>
                  </div>
                </div>
                {selectedBank === 'cih' && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Intitulé du compte</p>
                        <p className="font-medium">MEHDI AMADOUR</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Agence du client</p>
                        <p className="font-medium">BOUSKOURA VILLE VERTE</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Adresse de votre agence</p>
                        <p className="font-medium">PROJET BOUSKOURA GOLF CITY- IMM EP 9-CENTRE COMMERCIAL-MAGASIN 7 BOUSKOURA</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone de votre agence</p>
                        <p className="font-medium">05 22 88 61 90/93</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-800">R.I.B.</th>
                            <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-800">Code Banque</th>
                            <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-800">Code Ville</th>
                            <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-800">N° Compte</th>
                            <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-800">Clé RIB</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-2 text-sm text-center border">R.I.B.</td>
                            <td className="px-4 py-2 text-sm text-center border">230</td>
                            <td className="px-4 py-2 text-sm text-center border">791</td>
                            <td className="px-4 py-2 text-sm text-center border">4171053210312012</td>
                            <td className="px-4 py-2 text-sm text-center border">39</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">I.B.A.N.</p>
                      <p className="font-medium">MA64 2307 9141 7105 3211 0312 0139</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">B.I.C / SWIFT</p>
                      <p className="font-medium">CIHMMAMCXXX</p>
                    </div>
                  </div>
                )}
              </div>

              {/* PAYONEER BANK */}
              <div 
                className={`border rounded-lg overflow-hidden cursor-pointer ${
                  selectedBank === 'payoneer' ? 'border-blue-500 ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleBankSelection('payoneer')}
              >
                <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedBank === 'payoneer'}
                      onChange={() => handleBankSelection('payoneer')}
                      className="w-4 h-4 text-blue-600 border-gray-300"
                    />
                    <div className="ml-2 font-semibold">PAYONEER BANK</div>
                  </div>
                </div>
                {selectedBank === 'payoneer' && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-gray-600 dark:text-gray-400">Contact support for Payoneer bank transfer details.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
              <p>After transferring the payment amount, please provide the transfer receipt to expedite order processing.</p>
            </div>
          </div>
        </div>

        {/* Price Option Selection Modal */}
        {showPendingSelectionModal && currentPendingQuotation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-4xl w-full overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-[#0D47A1] dark:text-white">
                    Select Price Option
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Quotation ID: {currentPendingQuotation.id}
                  </p>
                </div>
                <button 
                  onClick={() => setShowPendingSelectionModal(false)}
                  className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image
                        src={currentPendingQuotation.product.image}
                        alt={currentPendingQuotation.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-2/3">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Product Name</span>
                        <h4 className="text-lg font-medium text-gray-800 dark:text-white">
                          {currentPendingQuotation.product.name}
                        </h4>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Category</span>
                        <p className="text-gray-800 dark:text-gray-200">
                          {currentPendingQuotation.product.category}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Quantity</span>
                        <p className="text-gray-800 dark:text-gray-200">
                          {currentPendingQuotation.quantity}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Shipping Method</span>
                        <p className="text-gray-800 dark:text-gray-200">
                          {currentPendingQuotation.shippingMethod}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Destination</span>
                        <p className="text-gray-800 dark:text-gray-200">
                          {currentPendingQuotation.destination}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {currentPendingQuotation.product.description && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Description</span>
                    <p className="text-gray-800 dark:text-gray-200 mt-1">
                      {currentPendingQuotation.product.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Price Options */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Select Price Option
                </h4>
                
                {/* Card-style price options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {currentPendingQuotation.priceOptions?.map((option) => (
                    <div 
                      key={option.id}
                      className={`border rounded-lg overflow-hidden transition-all h-full flex flex-col cursor-pointer ${
                        pendingPriceSelections[currentPendingQuotation.id] === option.id 
                          ? 'border-[#1E88E5] ring-2 ring-[#1E88E5]' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => handlePriceOptionSelection(currentPendingQuotation.id, option.id)}
                    >
                      {/* Option image if available */}
                      {option.modelImage && (
                        <div className="relative w-full h-40">
                          <Image
                            src={option.modelImage}
                            alt={option.modelName || "Product option"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="p-4 flex-1 flex flex-col">
                        {/* Option title */}
                        <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                          {option.modelName || `Option ${option.id}`}
                        </h4>
                        
                        {/* Price */}
                        <div className="text-xl font-bold text-[#0D47A1] dark:text-blue-400 mb-3">
                          {option.price}
                        </div>
                        
                        {/* Option details */}
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 flex-1">
                          <div className="flex items-center">
                            <span className="font-medium mr-1">Supplier:</span> {option.supplier}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-1">Delivery:</span> {option.deliveryTime}
                          </div>
                          {option.description && (
                            <div className="text-gray-500 dark:text-gray-400">
                              {option.description}
                            </div>
                          )}
                        </div>
                        
                        {/* Selection button - at the bottom */}
                        <div className="mt-4 pt-2">
                          <button
                            type="button"
                            onClick={() => handlePriceOptionSelection(currentPendingQuotation.id, option.id)}
                            className={`w-full py-2 px-3 rounded-md text-sm font-medium ${
                              pendingPriceSelections[currentPendingQuotation.id] === option.id
                                ? 'bg-[#1E88E5] text-white'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {pendingPriceSelections[currentPendingQuotation.id] === option.id ? 'Selected' : 'Select This Option'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setShowPendingSelectionModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePriceSelection}
                  disabled={!pendingPriceSelections[currentPendingQuotation.id]}
                  className="px-4 py-2 text-white bg-[#1E88E5] rounded-md hover:bg-[#0D47A1] disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  Save & Select
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Payment Modal */}
        {showProcessingModal && (
          <div className="fixed inset-0 z-[9999] backdrop-blur-md bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full shadow-2xl">
              {processingStatus === 'processing' ? (
                <div className="text-center py-6">
                  <div className="animate-spin inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mb-6"></div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Processing Payment</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Please wait while we process your payment...
                  </p>
                </div>
              ) : processingStatus === 'pending' ? (
                <div className="text-center py-4">
                  <div className="inline-block w-20 h-20 mb-4 text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Payment Processing</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
                    Your payment is being processed and needs approval from support.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Please complete the bank transfer and send the receipt for faster processing.
                  </p>
                  <div className="flex justify-center">
                    <button 
                      onClick={closeProcessingModal}
                      className="px-6 py-3 text-white bg-[#1E88E5] rounded-md hover:bg-[#0D47A1] font-medium text-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CheckoutPage; 
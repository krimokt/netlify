"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { CloseIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { supabase } from "@/lib/supabase";

interface PriceOption {
  id: string;
  price: string;
  supplier: string;
  deliveryTime: string;
  description?: string;
  modelName?: string;
  modelImage?: string;
}

interface QuotationDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: {
    id: string;
    product: {
      name: string;
      image: string;
      category?: string;
      description?: string;
      unitGrossWeight?: string;
    };
    quantity: string;
    date: string;
    status: string;
    shippingMethod: string;
    destination: string;
    priceOptions?: PriceOption[];
    price?: string;
  };
}

const QuotationDetailsModal: React.FC<QuotationDetailsProps> = ({ isOpen, onClose, quotation }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [savedOption, setSavedOption] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Use provided price options or empty array if none
  const displayPriceOptions = quotation.priceOptions && quotation.priceOptions.length > 0 
    ? quotation.priceOptions 
    : [];

  // Show price options UI only if there are options or if status is Approved
  const showPriceOptions = displayPriceOptions.length > 0 || quotation.status === "Approved";

  // Improved function with better error handling
  const saveOptionToDatabase = async (optionId: string) => {
    try {
      setIsSaving(true);
      
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error fetching session:", sessionError);
        alert("Unable to verify your login session. Please try logging out and back in.");
        return false;
      }
      
      const userId = session?.user?.id;
      
      if (!userId) {
        console.error("User not authenticated - no userId found in session");
        alert("You need to be logged in to save your selection. Please log in and try again.");
        return false;
      }

      // Check if optionId is a valid UUID
      if (!optionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error("Invalid option ID format:", optionId);
        alert("There was a problem with the selected option. Please try selecting a different option.");
        return false;
      }
      
      // First we need to find the actual UUID of the quotation in the database
      // since the ID we have might be formatted differently (like QT-2024-001)
      let quotationUuid;
      
      if (quotation.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // If the ID is already a valid UUID, use it directly
        quotationUuid = quotation.id;
      } else {
        // Try to find the actual UUID by quotation_id if it's a formatted ID
        const { data: quotationData, error: quotationError } = await supabase
          .from('quotations')
          .select('id')
          .eq('quotation_id', quotation.id)
          .maybeSingle();
          
        if (quotationError) {
          console.error("Error finding quotation UUID:", quotationError);
          alert("There was a problem accessing the quotation information. Please try again later.");
          return false;
        }
        
        if (!quotationData) {
          console.error("No matching quotation found for ID:", quotation.id);
          alert("This quotation could not be found in the database. Please refresh the page and try again.");
          return false;
        }
        
        quotationUuid = quotationData.id;
      }
      
      console.log("Debug - Attempting to save selection:", {
        quotationId: quotation.id,
        quotationUuid: quotationUuid,
        optionId: optionId,
        userId: userId
      });
      
      // First check if a selection already exists
      const { data: existingData, error: existingError } = await supabase
        .from('user_selections')
        .select('id')
        .eq('quotation_id', quotationUuid)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingError) {
        console.error("Error checking existing selection:", existingError);
        alert("There was a problem checking your previous selections. Please try again.");
        return false;
      }
      
      let result;
      
      // If a selection exists, update it
      if (existingData?.id) {
        console.log("Debug - Updating existing selection with ID:", existingData.id);
        result = await supabase
          .from('user_selections')
          .update({
            option_id: optionId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
      } 
      // Otherwise, create a new selection
      else {
        console.log("Debug - Creating new selection");
        result = await supabase
          .from('user_selections')
          .insert({
            quotation_id: quotationUuid,
            option_id: optionId,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      if (result.error) {
        const errorMessage = result.error.message || "Unknown error";
        console.error("Error saving selection:", result.error);
        console.error("Error details:", JSON.stringify(result.error, null, 2));
        
        // Handle common error cases
        if (errorMessage.includes("foreign key constraint")) {
          alert("The selected option or quotation no longer exists. Please refresh the page and try again.");
        } else if (errorMessage.includes("permission denied")) {
          alert("You don't have permission to save this selection. Please contact support.");
        } else {
          alert(`Error saving your selection: ${errorMessage}`);
        }
        
        return false;
      }
      
      console.log("Selection saved successfully:", result.data);
      return true;
      
    } catch (error) {
      console.error("Exception saving selection:", error);
      alert("An unexpected error occurred. Please try again or contact support if the problem persists.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!selectedOption) return;
    
    // Save the selected option to database
    const saved = await saveOptionToDatabase(selectedOption);
    
    if (saved) {
      // Save the selected option in local state
      setSavedOption(selectedOption);
      
      // Here you would handle accepting the quote with the selected price option
      console.log(`Accepting quote ${quotation.id} with price option ${selectedOption}`);
      
      // For now we'll just simulate acceptance
      alert(`Quotation ${quotation.id} has been accepted with the selected price option.`);
    } else {
      alert("Failed to save your selection. Please try again.");
    }
  };

  const handleSaveSelection = async () => {
    if (!selectedOption) return;
    
    // Save the selected option to database
    const saved = await saveOptionToDatabase(selectedOption);
    
    if (saved) {
      // Save the selected option in local state
      setSavedOption(selectedOption);
      
      // Confirm to user
      alert(`Your price option selection has been saved. You can now proceed to payment.`);
    } else {
      alert("Failed to save your selection. Please try again.");
    }
  };

  const handlePayNow = () => {
    const optionToUse = savedOption || selectedOption;
    if (!optionToUse) return;
    
    // Redirect to checkout page
    window.location.href = `/checkoutpage?quotation=${quotation.id}`;
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleImageClick = (imageSrc: string) => {
    setZoomImage(imageSrc);
    setZoomLevel(1);
  };

  // Price options section
  const renderPriceOptionsSection = () => {
    // If there are actual price options, display them
    if (displayPriceOptions.length > 0) {
      return (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Price Options
          </h3>
          <div className="space-y-6">
            {displayPriceOptions.map((option) => (
              <div 
                key={option.id}
                className={`p-4 border rounded-lg transition-all ${
                  selectedOption === option.id
                    ? 'border-[#1E88E5] bg-blue-50 dark:bg-blue-900/10'
                    : 'border-gray-200 hover:border-[#1E88E5] dark:border-gray-700'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {option.modelImage && (
                    <div 
                      className="w-full md:w-1/4 cursor-pointer"
                      onClick={() => handleImageClick(option.modelImage || '')}
                    >
                      <div className="relative w-full h-32 rounded overflow-hidden">
                        <Image
                          src={option.modelImage}
                          alt={option.modelName || 'Model Image'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className={`w-full ${option.modelImage ? 'md:w-3/4' : ''}`}>
                    <div className="flex flex-col md:flex-row justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">
                          {option.modelName || 'Price Option'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Supplier: {option.supplier}
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <span className="font-bold text-lg text-[#0D47A1] dark:text-blue-400">
                          {option.price}
                        </span>
                      </div>
                    </div>
                    {option.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {option.description}
                      </p>
                    )}
                    <div className="flex flex-wrap justify-between items-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Estimated Delivery: <span className="font-medium">{option.deliveryTime}</span>
                      </div>
                      <div className="mt-3 md:mt-0">
                        <Button
                          variant={selectedOption === option.id ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setSelectedOption(option.id)}
                          className={selectedOption === option.id 
                            ? "bg-[#1E88E5] hover:bg-[#0D47A1]" 
                            : "border-[#1E88E5] text-[#1E88E5] hover:bg-[#E3F2FD]"}
                        >
                          {selectedOption === option.id ? 'Selected' : 'Select Option'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // For different quotation statuses with no price options
    if (quotation.status === "Pending") {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <p className="text-yellow-700 dark:text-yellow-400 mb-2 font-medium">Waiting for price options from administrator</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-500">The administrator is currently preparing price options for this quotation. You will be notified when they are available.</p>
        </div>
      );
    }
    
    if (quotation.status === "Rejected") {
      return (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-700 dark:text-red-400 mb-2 font-medium">Quotation Rejected</p>
          <p className="text-sm text-red-600 dark:text-red-500">This quotation has been rejected. Please contact customer support for more information.</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-4xl h-auto mx-auto p-4 sm:p-6 overflow-hidden">
      {/* Modal header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-[#0D47A1] dark:text-white">
            Quotation {quotation.id}
          </h2>
          <div className="flex items-center mt-1">
            <span className="text-sm text-gray-500 mr-3">Created on {quotation.date}</span>
            <Badge
              size="sm"
              color={
                quotation.status === "Approved"
                  ? "success"
                  : quotation.status === "Pending"
                  ? "warning"
                  : "error"
              }
            >
              {quotation.status}
            </Badge>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="max-h-[calc(100vh-240px)] overflow-y-auto px-1 py-2">
        {/* Product Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Product Information
          </h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <div 
                className="relative w-full h-56 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => handleImageClick(quotation.product.image)}
              >
                <Image
                  src={quotation.product.image}
                  alt={quotation.product.name}
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
                    {quotation.product.name}
                  </h4>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Quantity</span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {quotation.quantity}
                  </p>
                </div>
                {quotation.status === "Approved" && quotation.product.unitGrossWeight && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Unit Gross Weight</span>
                    <p className="text-gray-800 dark:text-gray-200">
                      {quotation.product.unitGrossWeight}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Shipping Method</span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {quotation.shippingMethod}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Destination</span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {quotation.destination}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Shipping Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Shipping Method</span>
              <p className="text-gray-800 dark:text-gray-200">
                {quotation.shippingMethod}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Destination</span>
              <p className="text-gray-800 dark:text-gray-200">
                {quotation.destination}
              </p>
            </div>
          </div>
        </div>

        {/* Price Options Section */}
        {renderPriceOptionsSection()}

        {/* Action buttons */}
        <div className="mt-6 flex justify-end gap-3">
          {quotation.status === "Pending" ? (
            <Button
              variant="primary"
              disabled={!selectedOption || isSaving}
              onClick={handleAcceptQuote}
              className="bg-[#1E88E5] hover:bg-[#0D47A1]"
            >
              {isSaving ? 'Saving...' : 'Accept Quotation'}
            </Button>
          ) : (
            <>
              {selectedOption && !savedOption && (
                <Button
                  variant="outline"
                  onClick={handleSaveSelection}
                  disabled={isSaving}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  {isSaving ? 'Saving...' : 'Save Selection'}
                </Button>
              )}
              <Button
                variant="primary"
                disabled={(!selectedOption && !savedOption) || isSaving}
                onClick={handlePayNow}
                className="bg-[#1E88E5] hover:bg-[#0D47A1]"
              >
                Pay Now
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center" onClick={() => setZoomImage(null)}>
          <div className="relative max-w-6xl w-full p-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setZoomImage(null);
              }}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
            <div className="flex justify-center mb-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                className="mr-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="relative h-[calc(100vh-200px)] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full h-full" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}>
                <div className="flex items-center justify-center h-full">
                  <Image
                    src={zoomImage}
                    alt="Zoomed product"
                    width={1200}
                    height={800}
                    className="max-w-full max-h-full"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mock Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-3xl w-full overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Payment Options</h2>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Processing payment for Quotation {quotation.id} - Total: {selectedOption ? displayPriceOptions.find(opt => opt.id === selectedOption)?.price : quotation.price}
            </p>
            
            {/* Payment Methods Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                  <li className="mr-2">
                    <button className="inline-block p-4 border-b-2 border-blue-500 rounded-t-lg text-blue-500">
                      Bank Transfer
                    </button>
                  </li>
                  <li className="mr-2">
                    <button className="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300">
                      Credit Card
                    </button>
                  </li>
                </ul>
              </div>

              <h3 className="font-medium mb-3 text-lg text-center">THE CLIENT MAKE PAYMENT THROUGHT</h3>
              
              {/* Bank Options */}
              <div className="space-y-6">
                {/* WISE BANK */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center cursor-pointer">
                    <div className="flex items-center">
                      <div className="font-semibold">WISE BANK</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                        <p className="font-medium">Amadour Ltd</p>
                      </div>
                      <div>
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
                </div>

                {/* SOCIETE GENERALE BANK */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center cursor-pointer">
                    <div className="flex items-center">
                      <div className="font-semibold">SOCIETE GENERALE BANK</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
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
                </div>

                {/* CIH BANK */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center cursor-pointer">
                    <div className="flex items-center">
                      <div className="font-semibold">CIH BANK</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
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
                </div>

                {/* PAYONEER BANK */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center cursor-pointer">
                    <div className="flex items-center">
                      <div className="font-semibold">PAYONEER BANK</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-gray-600 dark:text-gray-400">Contact support for Payoneer bank transfer details.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                <p>After transferring the payment amount, please provide the transfer receipt to expedite order processing.</p>
                <p className="mt-2">You can also pay for multiple quotations at once through our <a href="/checkoutpage" className="text-blue-500 hover:underline">checkout page</a>.</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  onClose();
                  alert('Thank you for your order! Please complete the bank transfer to process your payment.');
                }}
                className="px-4 py-2 text-white bg-[#1E88E5] rounded-md hover:bg-[#0D47A1]"
              >
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default QuotationDetailsModal; 
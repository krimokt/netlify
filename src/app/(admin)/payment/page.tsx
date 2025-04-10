"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface PaymentInfo {
  id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  date: string;
  quotations: string[];
  paymentMethod: string;
  referenceNumber: string;
  proofUrl?: string;
}

interface QuotationInfo {
  id: string;
  product_name: string;
  quantity: string;
  status: string;
  created_at: string;
  product_images: string[];
  hasImage?: boolean;
  imageUrl?: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [quotationsMap, setQuotationsMap] = useState<Record<string, QuotationInfo[]>>({});
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedProofUrl, setExpandedProofUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUser(user);
        return user;
      } catch (error: any) {
        setError(error.message);
        return null;
      }
    };

    const fetchPayments = async (userId: string) => {
      try {
        // Fetch payments from Supabase
        const { data, error } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            status,
            created_at,
            quotation_ids,
            payment_method,
            reference_number,
            payment_proof_url
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Format the payment data
        const formattedPayments = data.map((payment: any) => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          date: new Date(payment.created_at).toLocaleDateString(),
          quotations: payment.quotation_ids || [],
          paymentMethod: payment.payment_method,
          referenceNumber: payment.reference_number,
          proofUrl: payment.payment_proof_url
        }));

        setPayments(formattedPayments);
        
        // Fetch quotation details for all payments
        await fetchQuotationDetails(formattedPayments);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchQuotationDetails = async (paymentsData: PaymentInfo[]) => {
      try {
        // Collect all quotation IDs
        const allQuotationIds = paymentsData.flatMap(payment => payment.quotations);
    
        if (allQuotationIds.length === 0) return;
        
        // Log quotation IDs for debugging
        console.log("Quotation IDs before filtering:", allQuotationIds);
        
        // UUID validation regex
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        // Filter out any invalid IDs - must be valid UUIDs
        const validQuotationIds = allQuotationIds.filter(id => {
          if (!id || typeof id !== 'string') return false;
          // Test if it's a valid UUID format
          return uuidRegex.test(id.trim());
        });
        
        if (validQuotationIds.length === 0) {
          console.warn("No valid UUID quotation IDs found. Original IDs:", allQuotationIds);
          const emptyQuotationsByPayment: Record<string, QuotationInfo[]> = {};
          paymentsData.forEach(payment => {
            emptyQuotationsByPayment[payment.id] = [];
          });
          setQuotationsMap(emptyQuotationsByPayment);
          return;
        }
        
        console.log(`Found ${validQuotationIds.length} valid UUIDs out of ${allQuotationIds.length} quotation IDs`);
        
        // Split IDs into smaller batches to avoid Supabase limitations
        const batchSize = 10; // Smaller batch size
        const quotationsById: Record<string, any> = {};
        
        // Process each batch individually
        for (let i = 0; i < validQuotationIds.length; i += batchSize) {
          const batch = validQuotationIds.slice(i, i + batchSize);
          const batchNumber = Math.floor(i/batchSize) + 1;
          
          console.log(`Processing batch ${batchNumber} with ${batch.length} UUIDs:`, batch);
          
          try {
            // Use a simpler query approach - fetch one by one if needed
            for (const quotationId of batch) {
              try {
                const { data, error } = await supabase
                  .from('quotations')
                  .select(`
                    id,
                    quotation_id,
                    product_name,
                    quantity, 
                    status,
                    created_at,
                    product_images
                  `)
                  .eq('id', quotationId)
                  .single();
                
                if (error) {
                  // Log specific error for this quotation and continue
                  console.error(`Error fetching quotation ${quotationId}:`, error);
                  continue;
                }
                
                if (data) {
                  quotationsById[quotationId] = data;
                  console.log(`Successfully fetched quotation: ${quotationId}`);
                }
              } catch (singleFetchError: any) {
                console.error(`Error in single fetch for ${quotationId}:`, singleFetchError?.message || singleFetchError);
              }
            }
          } catch (batchError: any) {
            console.error(`Error processing batch ${batchNumber}:`, batchError?.message || batchError);
            // Continue with other batches
          }
        }
        
        // Check if we got any results
        const quotationIds = Object.keys(quotationsById);
        if (quotationIds.length === 0) {
          console.warn("No quotation data retrieved after processing all batches");
          const emptyQuotationsByPayment: Record<string, QuotationInfo[]> = {};
          paymentsData.forEach(payment => {
            emptyQuotationsByPayment[payment.id] = [];
          });
          setQuotationsMap(emptyQuotationsByPayment);
          return;
        }
        
        console.log(`Successfully retrieved ${quotationIds.length} quotations out of ${validQuotationIds.length} valid IDs`);
        
        // Process quotation data and organize by payment
        const quotationsByPayment: Record<string, QuotationInfo[]> = {};
        
        paymentsData.forEach(payment => {
          const paymentQuotations = payment.quotations
            .filter(qId => quotationsById[qId]) // Only include quotations we found
            .map(qId => {
              const q = quotationsById[qId];
              
              // Handle image processing similar to quotation page
              let imageUrl = "/images/product/product-01.jpg";
              let hasImage = false;
              
              if (q.product_images && q.product_images.length > 0) {
                const rawImageUrl = q.product_images[0];
                
                if (rawImageUrl) {
                  try {
                    if (rawImageUrl.startsWith('/')) {
                      imageUrl = rawImageUrl;
                      hasImage = true;
                    } 
                    else if (rawImageUrl.includes('supabase.co/storage/v1/object/public')) {
                      imageUrl = rawImageUrl;
                      hasImage = true;
                    }
                    else if (!rawImageUrl.includes('://') && !rawImageUrl.startsWith('/')) {
                      imageUrl = `https://cfhochnjniddaztgwrbk.supabase.co/storage/v1/object/public/quotation-images/product-images/${rawImageUrl}`;
                      hasImage = true;
                    }
                    else if ((rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://'))) {
                      imageUrl = rawImageUrl;
                      hasImage = true;
                    }
                  } catch (e) {
                    console.warn("Invalid image URL:", rawImageUrl);
                    hasImage = false;
                  }
                }
              }
              
              return {
                id: q.quotation_id || `QT-${q.id}`,
                product_name: q.product_name,
                quantity: q.quantity,
                status: q.status,
                created_at: new Date(q.created_at).toLocaleDateString(),
                product_images: q.product_images || [],
                hasImage,
                imageUrl
              };
            });
            
          quotationsByPayment[payment.id] = paymentQuotations;
        });
        
        setQuotationsMap(quotationsByPayment);
      } catch (error: any) {
        // Enhanced error logging with message and stack trace
        console.error("Error fetching quotation details:", error?.message || "Unknown error");
        if (error?.stack) {
          console.error("Stack trace:", error.stack);
        }
        
        // Create empty mapping to avoid UI errors
        const emptyQuotationsByPayment: Record<string, QuotationInfo[]> = {};
        paymentsData.forEach(payment => {
          emptyQuotationsByPayment[payment.id] = [];
        });
        setQuotationsMap(emptyQuotationsByPayment);
      }
    };

    const init = async () => {
      const user = await fetchUser();
      if (user) {
        await fetchPayments(user.id);
      }
    };

    init();
  }, [router, supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'pending':
        return 'primary';
      case 'failed':
        return 'error';
      default:
        return 'light';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Approved';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Awaiting Admin Approval';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const handleUploadProof = async (paymentId: string) => {
    setCurrentPaymentId(paymentId);
    setIsUploadModalOpen(true);
    setUploadSuccess(false);
    setUploadError(null);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setCurrentPaymentId(null);
    setUploadSuccess(false);
    setUploadError(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset states when a new file is selected
    setUploadSuccess(false);
    setUploadError(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPaymentId) {
      setUploadError("Payment ID is missing.");
      return;
    }
    
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setUploadError("Please select a file to upload.");
      return;
    }
    
    const file = files[0];
    // Basic validation for file type and size
    if (!file.type.includes('image/') && !file.type.includes('application/pdf')) {
      setUploadError("Please upload an image or PDF file.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError("File size should be less than 5MB.");
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-proof-${currentPaymentId}-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`; // Store in a subfolder within quotation-images bucket
      
      // Upload to Supabase Storage - using quotation-images bucket which already exists
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('quotation-images') // Use existing bucket instead of payment-proofs
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('quotation-images') // Use same bucket for URL
        .getPublicUrl(filePath);
        
      const publicUrl = urlData.publicUrl;
      
      // Update payment record with proof URL
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_proof_url: publicUrl,
          status: 'processing', // Change status from pending to processing
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPaymentId);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update local state for the modified payment
      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === currentPaymentId 
            ? { 
                ...payment, 
                status: 'processing',
                proofUrl: publicUrl
              } 
            : payment
        )
      );
      
      setUploadSuccess(true);
      
      // Close modal after short delay to show success message
      setTimeout(() => {
        closeUploadModal();
      }, 2000);
      
    } catch (error: any) {
      console.error("Error uploading proof:", error);
      setUploadError(error.message || "Failed to upload payment proof.");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleExpandPayment = (paymentId: string) => {
    if (expandedPayment === paymentId) {
      setExpandedPayment(null);
    } else {
      setExpandedPayment(paymentId);
    }
  };

  // Add a function to handle the payment proof preview
  const openProofPreview = (url: string) => {
    setExpandedProofUrl(url);
  };

  const closeProofPreview = () => {
    setExpandedProofUrl(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment history...</p>
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
          onClick={() => router.push('/dashboard-home')}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Add this before the return statement to fix interface
  // to include proofUrl for full type safety
  const getPaymentById = (id: string) => {
    return payments.find(payment => payment.id === id);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#0D47A1] dark:text-white/90">
          Payment History
          </h1>
        <Link href="/checkoutpage">
          <Button variant="primary" className="bg-[#1E88E5] hover:bg-[#0D47A1]">
            Make New Payment
          </Button>
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-blue-700 font-semibold text-lg mb-3">No Payments Found</h2>
          <p className="text-blue-600 mb-4">You haven't made any payments yet.</p>
          <Link href="/quotation">
            <Button variant="primary" className="bg-blue-600 hover:bg-blue-700">
              View Quotations
            </Button>
          </Link>
            </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Recent Payments
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map((payment) => (
              <div key={payment.id} className="p-5">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Payment #{payment.id.slice(-6)}
                      </h3>
                      <Badge color={getStatusColor(payment.status)}>{getStatusText(payment.status)}</Badge>
          </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>Date: {payment.date}</p>
                      <p>Payment Method: {payment.paymentMethod}</p>
                      {payment.referenceNumber && (
                        <p>Reference: {payment.referenceNumber}</p>
                      )}
          </div>

                    {/* Payment proof thumbnail - if available */}
                    {payment.proofUrl && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Payment Proof:
                        </p>
                        <div 
                          className="inline-block max-w-[120px] border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openProofPreview(payment.proofUrl!)}
                        >
                          {payment.proofUrl.toLowerCase().endsWith('.pdf') ? (
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 flex items-center justify-center">
                              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
                              <span className="text-xs font-medium text-red-700 dark:text-red-400 ml-1">PDF</span>
            </div>
                          ) : (
                            <div className="relative h-20 w-20">
                              <Image
                                src={payment.proofUrl}
                                alt="Payment proof"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                                <svg className="w-6 h-6 text-white opacity-0 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
                            </div>
                          )}
            </div>
          </div>
                    )}

                    {payment.quotations.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Quotations: {payment.quotations.length}
                          </p>
                          <button 
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center"
                            onClick={() => toggleExpandPayment(payment.id)}
                          >
                            {expandedPayment === payment.id ? (
                              <>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Hide Details
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            View Details
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {payment.quotations.map((id) => (
                            <span key={id} className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              {id.slice(-6)}
                            </span>
                          ))}
            </div>
          </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        ${payment.amount.toLocaleString()}
        </div>
      </div>

                    {payment.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleUploadProof(payment.id)}
                      >
                        Upload Proof
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Expanded Quotation Details */}
                {expandedPayment === payment.id && quotationsMap[payment.id] && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Quotation Details</h4>
                    <div className="space-y-3">
                      {quotationsMap[payment.id].map(quotation => (
                        <div key={quotation.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                          <div className="p-3 flex items-start gap-3">
                            <div className="flex-shrink-0 w-16 h-16 relative rounded overflow-hidden">
                              {quotation.hasImage ? (
                                <Image
                                  src={quotation.imageUrl || "/images/product/product-01.jpg"}
                                  alt={quotation.product_name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                  No image
              </div>
                              )}
            </div>
              
                            <div className="flex-1">
                              <div className="flex flex-wrap justify-between">
              <div>
                                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {quotation.product_name}
                                  </h5>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      ID: {quotation.id}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Quantity: {quotation.quantity}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Date: {quotation.created_at}
                                    </span>
                                  </div>
                                </div>
                                <Badge size="sm" color={getStatusColor(quotation.status)}>
                                  {quotation.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                      </div>
            ))}
                      </div>
                    </div>
      )}
                
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Payment Information
          </h2>
                  </div>
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Bank Transfer Information</h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm mb-1"><strong>WISE BANK:</strong> Account Number: 123456789</p>
                <p className="text-sm mb-1"><strong>SOCIETE GENERALE:</strong> IBAN: FR7612345678901234567890123</p>
                <p className="text-sm mb-1"><strong>CIH BANK:</strong> Account Number: 987654321</p>
                <p className="text-sm"><strong>PAYONEER:</strong> Email: payments@mesmorocco.com</p>
                </div>
              </div>
                
              <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Payment Process</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-2">
                <li>Select your quotations for payment on the checkout page</li>
                <li>Complete the payment using one of our available payment methods</li>
                <li>Upload proof of payment for verification</li>
                <li>Wait for administrator approval of your payment</li>
                <li>Once payment is approved, your order will be processed</li>
              </ol>
                    </div>
                  </div>
                </div>
              </div>

      {/* Payment Proof Preview Modal */}
      {expandedProofUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={closeProofPreview}
                className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
                    </div>

            {expandedProofUrl.toLowerCase().endsWith('.pdf') ? (
              <div className="p-6 text-center">
                <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">PDF Document</h3>
                <a
                  href={expandedProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 font-medium"
                >
                  Open PDF
                </a>
                        </div>
            ) : (
              <div className="relative w-full" style={{ height: "calc(100vh - 200px)" }}>
                <Image
                  src={expandedProofUrl}
                  alt="Payment proof"
                  fill
                  className="object-contain"
                />
                        </div>
                      )}
                    </div>
                  </div>
      )}

      {/* Add Upload Proof Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload Payment Proof
              </h3>
              <button 
                onClick={closeUploadModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
                  </div>
            
            {currentPaymentId && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Payment ID: <span className="font-medium">{currentPaymentId.slice(-6)}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Amount: <span className="font-medium">${getPaymentById(currentPaymentId)?.amount.toLocaleString()}</span>
                </p>
                </div>
              )}
                
            {uploadSuccess ? (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 p-4 rounded-lg mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                Payment proof uploaded successfully! Your payment status has been updated to "processing".
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Proof of Payment
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-medium
                        file:bg-blue-50 file:text-blue-700
                        dark:file:bg-blue-900/20 dark:file:text-blue-300
                        hover:file:bg-blue-100"
                      accept="image/*,application/pdf"
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Accepted formats: Images (PNG, JPG) or PDF. Maximum size: 5MB.
                    </p>
                  </div>
                </div>
                
                {uploadError && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                    {uploadError}
                </div>
              )}
                
                <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                  size="sm"
                    onClick={closeUploadModal}
                    disabled={isUploading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                  size="sm"
                  className="bg-[#1E88E5] hover:bg-[#0D47A1] text-white"
                    disabled={isUploading}
                >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : "Upload Proof"}
                </Button>
                </div>
              </form>
              )}
            </div>
          </div>
        )}
    </div>
  );
} 
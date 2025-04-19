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
  proofUrl?: string;
}

interface QuotationInfo {
  id: string;
  uuid: string;
  product_name: string;
  quantity: string;
  status: string;
  created_at: string;
  product_images: string[];
  hasImage?: boolean;
  imageUrl?: string;
}

// Define types for error to avoid using 'any'
interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
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
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw authError;
        }
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        return user;
      } catch (error: unknown) {
        const supabaseError = error as SupabaseError;
        setError(supabaseError.message);
        return null;
      }
    };

    const fetchPayments = async (userId: string) => {
      try {
        // Fetch payments from Supabase using updated column names
        const { data, error } = await supabase
          .from('payments')
          .select(`
            id,
            total_amount,
            status,
            created_at,
            method,
            proof_url
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Format the payment data with the new column names
        const formattedPayments = data.map((payment: Record<string, unknown>) => ({
          id: payment.id as string,
          amount: payment.total_amount as number,
          status: payment.status as "pending" | "processing" | "completed" | "failed",
          date: new Date((payment.created_at as string)).toLocaleDateString(),
          quotations: [], // Will be populated from payment_quotations
          paymentMethod: payment.method as string,
          proofUrl: payment.proof_url as string | undefined
        }));

        setPayments(formattedPayments);
        
        // Fetch quotation details for all payments
        await fetchQuotationDetails(formattedPayments);
      } catch (error: unknown) {
        const supabaseError = error as SupabaseError;
        setError(supabaseError.message);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchQuotationDetails = async (paymentsData: PaymentInfo[]) => {
      try {
        if (paymentsData.length === 0) return;
        
        // For each payment, get quotations from the payment_quotations junction table
        for (const payment of paymentsData) {
          try {
            // Get associated quotation IDs from junction table
            const { data: junctionData, error: junctionError } = await supabase
              .from('payment_quotations')
              .select('quotation_id, payment_id')
              .eq('payment_id', payment.id);
            
            if (junctionError) {
              console.error("Error fetching payment-quotation links:", junctionError);
              console.log("Junction table error details:", JSON.stringify(junctionError, null, 2));
            }
            
            // Get the quotation IDs from the junction table
            let quotationIds: string[] = [];
            
            if (junctionData && junctionData.length > 0) {
              console.log(`Found ${junctionData.length} quotation links for payment ID: ${payment.id}`);
              quotationIds = junctionData.map(item => item.quotation_id);
            } else {
              console.log(`No junction data found for payment ID: ${payment.id}, checking quotation_ids array...`);
              
              // If no junction data, try to get quotation IDs from the quotation_ids array field
              const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .select('quotation_ids')
                .eq('id', payment.id)
                .single();
              
              if (paymentError) {
                console.error(`Error fetching quotation_ids for payment ID: ${payment.id}`, paymentError);
              } else if (paymentData && paymentData.quotation_ids && Array.isArray(paymentData.quotation_ids)) {
                console.log(`Found ${paymentData.quotation_ids.length} quotation IDs in array for payment ID: ${payment.id}`);
                quotationIds = paymentData.quotation_ids;
              }
            }
            
            // If no quotation IDs found from either source, skip this payment
            if (quotationIds.length === 0) {
              console.log(`No quotation IDs found for payment ID: ${payment.id}`);
              continue;
            }
            
            // Update the payment's quotations array
            payment.quotations = quotationIds;
            console.log("Quotation IDs:", quotationIds);
            
            // Directly try to fetch each quotation individually first for better error messages
            const quotationResults = [];
            
            for (const quotationId of quotationIds) {
              try {
                // Try to get this specific quotation
                const { data: singleQuotation, error: singleQuotationError } = await supabase
                  .from('quotations')
                  .select('*')
                  .eq('id', quotationId)
                  .single();
                
                if (singleQuotationError) {
                  console.error(`Error fetching quotation ID: ${quotationId}`, singleQuotationError);
                  continue; // Skip this quotation
                }
                
                if (singleQuotation) {
                  console.log(`Successfully fetched quotation: ${quotationId}`);
                  quotationResults.push(singleQuotation);
                } else {
                  console.warn(`Quotation not found: ${quotationId}`);
                }
              } catch (singleError) {
                console.error(`Exception fetching quotation ID: ${quotationId}`, singleError);
              }
            }
            
            console.log(`Successfully fetched ${quotationResults.length} out of ${quotationIds.length} quotations`);
            
            if (quotationResults.length === 0) {
              console.log(`No quotation details could be retrieved for payment ID: ${payment.id}`);
              continue;
            }
            
            // Process and format quotation data
            const formattedQuotations = quotationResults.map(q => {
              // Handle image processing
              let imageUrl = "/images/product/product-01.jpg";
              let hasImage = false;
              
              if (q.image_url) {
                imageUrl = q.image_url;
                hasImage = true;
              }
              else if (q.product_images && q.product_images.length > 0) {
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
                  } catch {
                    // Ignore error and use default values
                    console.warn("Invalid image URL:", rawImageUrl);
                    hasImage = false;
                  }
                }
              }
              
              return {
                id: q.quotation_id || `QT-${q.id}`,
                uuid: q.id,
                product_name: q.product_name,
                quantity: q.quantity,
                status: q.status,
                created_at: new Date(q.created_at).toLocaleDateString(),
                product_images: q.product_images || [],
                hasImage,
                imageUrl
              };
            });
              
            // Update the quotations map with this payment's quotations
            setQuotationsMap(prev => ({
              ...prev,
              [payment.id]: formattedQuotations
            }));
          } catch (err) {
            console.error("Exception processing payment:", err);
            // Continue to next payment
          }
        }
      } catch (error: unknown) {
        console.error("Error fetching quotation details:", error);
        if (error instanceof Error) {
          console.log("Error message:", error.message);
          console.log("Error stack:", error.stack);
        }
      }
    };

    const init = async () => {
      const user = await fetchUser();
      if (user) {
        await fetchPayments(user.id);
      }
    };

    init();
  }, [router]);

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

  const handleFileChange = () => {
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
      const filePath = `payment-proofs/${fileName}`;
      
      // Upload to Supabase Storage with correct bucket name
      const { error: uploadError } = await supabase.storage
        .from('Payment Proof Documents')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL for the uploaded file with correct bucket name
      const { data: urlData } = supabase.storage
        .from('Payment Proof Documents')
        .getPublicUrl(filePath);
        
      const publicUrl = urlData.publicUrl;
      
      // Update payment record with proof URL - using correct column name
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          proof_url: publicUrl,
          status: 'processing' // Change status from pending to processing
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
      
    } catch (error: unknown) {
      console.error("Error uploading proof:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload payment proof.";
      setUploadError(errorMessage);
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
          <p className="text-blue-600 mb-4">You haven&apos;t made any payments yet.</p>
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
                      <Badge color={getStatusColor(payment.status)}>{payment.status}</Badge>
          </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>Date: {payment.date}</p>
                      <p>Payment Method: {payment.paymentMethod}</p>
          </div>

                    {/* Payment proof thumbnail - if available */}
                    {payment.proofUrl && (
                      <div className="mt-2">
                        <button 
                          onClick={() => openProofPreview(payment.proofUrl as string)}
                          className="inline-flex items-center text-sm text-blue-500 hover:text-blue-700"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
                          View Payment Proof
                          </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">${payment.amount.toFixed(2)}</div>

                    {payment.status === 'pending' && !payment.proofUrl && (
                      <Button
                        onClick={() => handleUploadProof(payment.id)}
                        variant="primary"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Upload Proof
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => toggleExpandPayment(payment.id)}
                      variant="outline"
                      size="sm"
                      className="text-gray-500 border-gray-300"
                    >
                      {expandedPayment === payment.id ? 'Hide Details' : 'View Details'}
                    </Button>
                  </div>
                </div>
                
                {/* Quotation details - shown when expanded */}
                {expandedPayment === payment.id && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quotations in this payment:
                    </h4>
                    
                    {quotationsMap[payment.id]?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {quotationsMap[payment.id].map((quotation) => (
                          <div 
                            key={quotation.uuid} 
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-start gap-3 bg-gray-50 dark:bg-gray-900"
                          >
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                              {quotation.hasImage ? (
                                <Image
                                  src={quotation.imageUrl || ''} 
                                  alt={quotation.product_name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
              </div>
                              )}
            </div>
                            <div className="flex-grow">
                              <h5 className="text-sm font-medium text-gray-800 dark:text-white">
                                    {quotation.product_name}
                                  </h5>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <p>Quantity: {quotation.quantity}</p>
                                <p>Quotation ID: {quotation.id}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No quotation details available
                      </p>
                    )}
                  </div>
                )}
                      </div>
            ))}
                      </div>
                    </div>
      )}
                
      {/* Payment Proof Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Payment Proof</h3>
              <button 
                onClick={closeUploadModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
                  </div>
                
            {uploadSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Upload Successful!</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your payment proof has been uploaded and will be reviewed shortly.
                  </p>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Proof of Payment
                  </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Please upload a screenshot or photo of your payment receipt. Accepted formats: JPG, PNG, PDF (max 5MB).
                    </p>
                    
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center"
                      >
                        <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Click to select file or drag and drop
                        </span>
                      </button>
                </div>
                    
                    {fileInputRef.current?.files?.[0] && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Selected: <span className="font-medium">{fileInputRef.current.files[0].name}</span>
                        </span>
                      </div>
                    )}
                
                {uploadError && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {uploadError}
                </div>
              )}
                  </div>
                
                  <div className="flex justify-end gap-3">
              <Button
                      onClick={closeUploadModal}
                variant="outline"
                      type="button"
                    disabled={isUploading}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Cancel
                </Button>
                <Button
                      variant="primary"
                    type="submit"
                      disabled={isUploading || !fileInputRef.current?.files?.[0]}
                      className={isUploading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
                  >
                    {isUploading ? (
                      <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Uploading...
                      </>
                      ) : (
                        "Upload Proof"
                      )}
                </Button>
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Proof Preview Modal */}
      {expandedProofUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={closeProofPreview}>
          <div className="max-w-3xl w-full max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment Proof</h3>
              <button 
                onClick={closeProofPreview}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-900 h-[70vh] overflow-auto">
              {expandedProofUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={expandedProofUrl} className="w-full h-full" title="Payment Proof PDF"></iframe>
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={expandedProofUrl}
                    alt="Payment Proof"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              )}
            </div>
            </div>
          </div>
        )}
    </div>
  );
} 
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

// Cache configuration
const CACHE_KEY = 'payment_data_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

// Define types for error to avoid using 'any'
interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Define the cache structure
interface CacheData {
  payments: PaymentInfo[];
  quotationsMap: Record<string, QuotationInfo[]>;
  timestamp: number;
}

export default function PaymentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quotationsMap, setQuotationsMap] = useState<Record<string, QuotationInfo[]>>({});
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // First check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw authError;
        }
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        // Try to get data from cache first
        const cachedData = getCachedData(user.id);
        
        if (cachedData && !isRefreshing) {
          // Use cached data if available and not explicitly refreshing
          console.log('Using cached payment data');
          setPayments(cachedData.payments);
          setQuotationsMap(cachedData.quotationsMap);
          setIsLoading(false);
          return;
        }
        
        // Fetch fresh data from database
        await fetchPayments(user.id);
        
      } catch (error: unknown) {
        const supabaseError = error as SupabaseError;
        setError(supabaseError.message);
        setIsLoading(false);
      }
    };

    loadData();
    // Reset refreshing flag after data load
    setIsRefreshing(false);
  }, [router, isRefreshing]);

  // Function to get cached data if valid
  const getCachedData = (userId: string): CacheData | null => {
    try {
      const cachedDataString = localStorage.getItem(`${CACHE_KEY}_${userId}`);
      if (!cachedDataString) return null;
      
      const cachedData = JSON.parse(cachedDataString) as CacheData;
      const now = Date.now();
      
      // Check if cache is still valid (not expired)
      if (now - cachedData.timestamp < CACHE_EXPIRY) {
        return cachedData;
      }
      
      // Clear expired cache
      localStorage.removeItem(`${CACHE_KEY}_${userId}`);
      return null;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  };

  // Function to save data to cache
  const saveToCache = (userId: string, data: CacheData) => {
    try {
      localStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving to cache:', error);
      // If caching fails, just continue without caching
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
          proof_url,
          quotation_ids
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
        quotations: (payment.quotation_ids as string[] || []), // Use quotation_ids directly if available
        paymentMethod: payment.method as string,
        proofUrl: payment.proof_url as string | undefined
      }));

      setPayments(formattedPayments);
      
      // Fetch all quotation details at once
      const quotationMap = await fetchAllQuotationDetails(formattedPayments);
      
      // Cache the data for future use
      saveToCache(userId, {
        payments: formattedPayments,
        quotationsMap: quotationMap,
        timestamp: Date.now()
      });
      
    } catch (error: unknown) {
      const supabaseError = error as SupabaseError;
      setError(supabaseError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllQuotationDetails = async (paymentsData: PaymentInfo[]) => {
    const quotationMap: Record<string, QuotationInfo[]> = {};
    
    try {
      if (paymentsData.length === 0) return quotationMap;
      
      // Collect all quotation IDs across all payments
      const allQuotationIds: string[] = [];
      const quotationToPaymentMap: Record<string, string> = {};
      
      // First get all relevant quotation IDs
      for (const payment of paymentsData) {
        if (payment.quotations.length > 0) {
          // Already has quotation IDs
          payment.quotations.forEach(qId => {
            allQuotationIds.push(qId);
            quotationToPaymentMap[qId] = payment.id;
          });
        } else {
          // Try to get from junction table - could optimize this in the future
          const { data: junctionData } = await supabase
            .from('payment_quotations')
            .select('quotation_id')
            .eq('payment_id', payment.id);
            
          if (junctionData && junctionData.length > 0) {
            const ids = junctionData.map(item => item.quotation_id);
            // Update the payment with quotation IDs
            payment.quotations = ids;
            
            ids.forEach(qId => {
              allQuotationIds.push(qId);
              quotationToPaymentMap[qId] = payment.id;
            });
          }
        }
      }
      
      // If no quotation IDs found, return empty map
      if (allQuotationIds.length === 0) {
        return quotationMap;
      }
      
      // Fetch all quotations in a single query - much more efficient!
      const { data: allQuotations, error: quotationsError } = await supabase
        .from('quotations')
        .select('*')
        .in('id', allQuotationIds);
      
      if (quotationsError) {
        console.error("Error fetching quotations:", quotationsError);
        return quotationMap;
      }
      
      if (!allQuotations || allQuotations.length === 0) {
        console.log("No quotations found for the provided IDs");
        return quotationMap;
      }
      
      // Process all quotations and organize them by payment ID
      allQuotations.forEach(q => {
        const paymentId = quotationToPaymentMap[q.id];
        if (!paymentId) return; // Skip if no payment ID mapping found
        
        // Initialize array for this payment if needed
        if (!quotationMap[paymentId]) {
          quotationMap[paymentId] = [];
        }
        
        // Process image URL - simplified logic
        let imageUrl = "/images/product/product-01.jpg";
        let hasImage = false;
        
        if (q.image_url) {
          imageUrl = q.image_url;
          hasImage = true;
        }
        else if (q.product_images && q.product_images.length > 0 && q.product_images[0]) {
          imageUrl = q.product_images[0];
          hasImage = true;
          
          // Make sure image URL is fully qualified
          if (!imageUrl.includes('://') && !imageUrl.startsWith('/')) {
            imageUrl = `https://cfhochnjniddaztgwrbk.supabase.co/storage/v1/object/public/quotation-images/product-images/${imageUrl}`;
          }
        }
        
        // Create formatted quotation object
        const formattedQuotation: QuotationInfo = {
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
        
        // Add to the map
        quotationMap[paymentId].push(formattedQuotation);
      });
      
      // Update state with the complete quotation map
      setQuotationsMap(quotationMap);
      
      return quotationMap;
      
    } catch (error) {
      console.error("Error processing quotations:", error);
      return quotationMap;
    }
  };

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

  const handleRefreshData = () => {
    setIsLoading(true);
    setIsRefreshing(true);
  };

  const handleUploadProof = (paymentId: string) => {
    setCurrentPaymentId(paymentId);
    setUploadSuccess(false);
    setUploadError(null);
    
    // Always expand the payment row
    setExpandedPayment(paymentId);
    
    // Reset file input if it exists
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = () => {
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
      
      // Important: Don't include a path prefix, just use the filename
      const filePath = fileName;
      
      console.log("Uploading file:", fileName, "to bucket: payment_proofs");
      
      // Upload to Supabase Storage with correct bucket ID
      const uploadResult = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file, {
          upsert: true
        });
        
      if (uploadResult.error) {
        console.error("Upload error:", uploadResult.error);
        
        // Check if this is an RLS policy violation
        if (uploadResult.error.message && uploadResult.error.message.includes("new row violates row-level security policy")) {
          throw new Error(`Upload failed due to security policy. Please make sure you're logged in and have permission to upload files. 
          Technical details: ${uploadResult.error.message}`);
        }
        
        throw new Error(`Upload failed: ${uploadResult.error.message}`);
      }
      
      console.log("File uploaded successfully");
      
      // Get public URL 
      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath);
        
      if (!urlData || !urlData.publicUrl) {
        throw new Error("Failed to generate public URL");
      }
      
      const publicUrl = urlData.publicUrl;
      console.log("Generated public URL:", publicUrl);
      
      // Update payment record with proof URL
      console.log("Updating payment record with ID:", currentPaymentId);
      console.log("Setting proof_url and payment_proof to:", publicUrl);
      
      const { data: updateData, error: updateError } = await supabase
        .from('payments')
        .update({
          proof_url: publicUrl,
          payment_proof: publicUrl, // Update both proof columns
          status: 'processing' // Change status from pending to processing
        })
        .eq('id', currentPaymentId)
        .select();
        
      if (updateError) {
        console.error("Database update error:", updateError);
        throw new Error(`Failed to update payment record: ${updateError.message}`);
      }
      
      if (!updateData || updateData.length === 0) {
        console.error("No payment record was updated. Possible reasons:");
        console.error("- Payment ID might not exist:", currentPaymentId);
        console.error("- User might not have permission to update this record");
        throw new Error("Failed to update payment record: No record was updated");
      }
      
      console.log("Payment record updated successfully:", updateData);
      
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
      
      // Also update cache after successful upload
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cachedData = getCachedData(user.id);
        if (cachedData) {
          cachedData.payments = cachedData.payments.map(payment => 
            payment.id === currentPaymentId 
              ? { 
                  ...payment, 
                  status: 'processing',
                  proofUrl: publicUrl
                } 
              : payment
          );
          saveToCache(user.id, cachedData);
        }
      }
      
      setUploadSuccess(true);
      
      // Reset state after short delay
      setTimeout(() => {
        // Reset state and file input after successful upload
        setCurrentPaymentId(null);
        setUploadSuccess(false);
        setUploadError(null);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);
      
    } catch (error: unknown) {
      console.error("Error in upload process:", error);
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
          className="mt-4 bg-[#1E88E5] hover:bg-[#0D47A1]"
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
          <Button 
            variant="outline" 
            size="sm"
            className="text-[#1E88E5] border-[#1E88E5] hover:bg-blue-50"
            onClick={handleRefreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </Button>
      </div>

      {/* Bank Accounts Section - updated for white bg in dark mode */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Bank Account Details
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Please use one of the following bank accounts for your payments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
          {/* Wise Bank */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <Image 
                  src="/images/banks/wise.jpeg" 
                  alt="Wise Bank" 
                  width={60} 
                  height={60} 
                  className="mr-3"
                />
                <h3 className="text-lg font-medium text-gray-800">Wise Bank</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => navigator.clipboard.writeText("BE24 9052 0546 8538")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </Button>
            </div>
            <div className="space-y-2 text-sm text-gray-800">
              <p><span className="font-medium">Name:</span> Amaadour Ltd</p>
              <p><span className="font-medium">IBAN:</span> BE24 9052 0546 8538</p>
              <p><span className="font-medium">Swift/BIC:</span> TRWIBEB1XXX</p>
              <p><span className="font-medium">Address:</span> Wise, Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium</p>
            </div>
          </div>

          {/* Société Générale */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <Image 
                  src="/images/banks/societe.jpeg" 
                  alt="Société Générale" 
                  width={60} 
                  height={60} 
                  className="mr-3"
                />
                <h3 className="text-lg font-medium text-gray-800">Société Générale</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => navigator.clipboard.writeText("022 780 000359002837327 74")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </Button>
            </div>
            <div className="space-y-2 text-sm text-gray-800">
              <p><span className="font-medium">Name:</span> AMAADOUR MEHDI</p>
              <p><span className="font-medium">Code SWIFT:</span> SGMBMAMC</p>
              <p><span className="font-medium">Agency:</span> AL QODS OULAD TALEB</p>
              <p><span className="font-medium">Bank Code:</span> 022</p>
              <p><span className="font-medium">Agency Code:</span> 780</p>
              <p><span className="font-medium">Account Number:</span> 000359002837327</p>
              <p><span className="font-medium">RIB Key:</span> 74</p>
              <p><span className="font-medium">Currency:</span> MAD</p>
            </div>
          </div>

          {/* CIH Bank */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <Image 
                  src="/images/banks/cih.jpeg" 
                  alt="CIH Bank" 
                  width={60} 
                  height={60} 
                  className="mr-3"
                />
                <h3 className="text-lg font-medium text-gray-800">CIH Bank</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => navigator.clipboard.writeText("MA64 2307 0141 7105 5211 0312 0150")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </Button>
            </div>
            <div className="space-y-2 text-sm text-gray-800">
              <p><span className="font-medium">Name:</span> MEHDI AMAADOUR</p>
              <p><span className="font-medium">Agency:</span> BOUSKOURA VILLE VERTE</p>
              <p><span className="font-medium">IBAN:</span> MA64 2307 0141 7105 5211 0312 0150</p>
              <p><span className="font-medium">BIC/SWIFT:</span> CIHAMAMC</p>
              <p><span className="font-medium">Bank Code:</span> 230</p>
              <p><span className="font-medium">City Code:</span> 791</p>
              <p><span className="font-medium">Account Number:</span> 4171063211031201</p>
              <p><span className="font-medium">RIB Key:</span> 39</p>
            </div>
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-blue-700 font-semibold text-lg mb-3">No Payments Found</h2>
          <p className="text-blue-600 mb-4">You haven&apos;t made any payments yet.</p>
          <Link href="/quotation">
            <Button variant="primary" className="bg-[#1E88E5] hover:bg-[#0D47A1]">
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
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">${payment.amount.toFixed(2)}</div>

                    <Button
                      onClick={() => handleUploadProof(payment.id)}
                      variant="primary"
                      size="sm"
                      className={payment.proofUrl ? "bg-[#1E88E5] hover:bg-[#0D47A1]" : "bg-[#1E88E5] hover:bg-[#0D47A1]"}
                    >
                      {payment.proofUrl ? "Update Proof" : "Upload Proof"}
                    </Button>
                    
                    <Button
                      onClick={() => toggleExpandPayment(payment.id)}
                      variant="outline"
                      size="sm"
                      className="text-[#1E88E5] border-[#1E88E5] hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400"
                    >
                      {expandedPayment === payment.id ? 'Hide Details' : 'View Details'}
                    </Button>
                  </div>
                </div>
                
                {/* Quotation details - shown when expanded */}
                {expandedPayment === payment.id && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    {/* Payment Proof Upload Section */}
                    <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Payment Proof
                      </h4>
                      
                      {payment.proofUrl ? (
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                          <div className="mt-2 md:mt-0">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              You&apos;ve already uploaded proof for this payment.
                            </p>
                            
                            {currentPaymentId === payment.id && (
                              <form onSubmit={handleUploadSubmit} className="mt-3 border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  Replace with a new payment proof:
                                </p>
                                
                                <div className="flex flex-wrap gap-3 items-end">
                                  <div>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,application/pdf"
                                      className="hidden"
                                      ref={fileInputRef}
                                      onChange={handleFileChange}
                                    />
                                    <Button
                                      type="button" 
                                      onClick={() => fileInputRef.current?.click()}
                                      variant="outline"
                                      size="sm"
                                      className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                    >
                                      Select File
                                    </Button>
                                  </div>
                                  
                                  {fileInputRef.current?.files?.[0] && (
                                    <>
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {fileInputRef.current.files[0].name}
                                      </span>
                                      <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={isUploading}
                                        className={isUploading ? "bg-blue-400 cursor-not-allowed" : "bg-[#1E88E5] hover:bg-[#0D47A1]"}
                                      >
                                        {isUploading ? (
                                          <>
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                            Uploading...
                                          </>
                                        ) : (
                                          "Upload"
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </div>
                                
                                {uploadError && (
                                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {uploadError}
                                  </div>
                                )}
                                
                                {uploadSuccess && (
                                  <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Upload successful!
                                  </div>
                                )}
                              </form>
                            )}
                            
                            {currentPaymentId !== payment.id && (
                              <Button
                                onClick={() => handleUploadProof(payment.id)} 
                                variant="outline"
                                size="sm"
                                className="mt-1 border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              >
                                Replace Proof
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {currentPaymentId === payment.id ? (
                            <form onSubmit={handleUploadSubmit}>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Please upload a screenshot or photo of your payment receipt.
                                Accepted formats: JPG, PNG, PDF (max 5MB).
                              </p>
                              
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
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
                                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Click to select file or drag and drop
                                  </span>
                                </button>
                              </div>
                              
                              {fileInputRef.current?.files?.[0] && (
                                <div className="flex items-center justify-between mt-2 mb-3">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Selected: <span className="font-medium">{fileInputRef.current.files[0].name}</span>
                                  </span>
                                  
                                  <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={isUploading}
                                    className={isUploading ? "bg-blue-400 cursor-not-allowed" : "bg-[#1E88E5] hover:bg-[#0D47A1]"}
                                  >
                                    {isUploading ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                        Uploading...
                                      </>
                                    ) : (
                                      "Upload Proof"
                                    )}
                                  </Button>
                                </div>
                              )}
                              
                              {uploadError && (
                                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                                  {uploadError}
                                </div>
                              )}
                              
                              {uploadSuccess && (
                                <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Upload successful!
                                </div>
                              )}
                            </form>
                          ) : (
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                No payment proof has been uploaded yet.
                              </p>
                              <Button
                                onClick={() => handleUploadProof(payment.id)} 
                                variant="primary"
                                size="sm"
                                className="w-fit mt-1 bg-[#1E88E5] hover:bg-[#0D47A1]"
                              >
                                Upload Proof
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  
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
                        No quotations found for this payment.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
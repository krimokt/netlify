"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CloseIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { QuotationData } from "@/types/quotation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Available payment methods
const PAYMENT_METHODS = [
  { id: 'WISE', name: 'WISE BUSINESS', icon: '🏦', currency: 'EUR' },
  { id: 'SOCIETE_GENERALE', name: 'SOCIETE GENERALE MAROC', icon: '🏦', currency: 'EUR' },
  { id: 'CIH', name: 'CIH BANK', icon: '🏦', currency: 'MAD' }
];

// Bank information component
const BankInformation = ({ bankId }: { bankId: string }) => {
  const bankInfo = {
    WISE: {
      accountName: "WISE BUSINESS",
      iban: "BE12 3456 7890 1234",
      swift: "TRWIBEB1XXX",
      bankAddress: "Avenue Louise 54, Room S52, Brussels 1050, Belgium",
      accountDetails: "Account number: 1234567890",
      currency: "EUR"
    },
    SOCIETE_GENERALE: {
      accountName: "SOCIETE GENERALE MAROC",
      iban: "FR76 3000 6000 0123 4567 8900 189",
      swift: "SOGEFRPP",
      bankAddress: "29 Boulevard Haussmann, 75009 Paris, France",
      accountDetails: "Account number: 00020012345",
      rib: "123456789012345678901234",
      currency: "EUR"
    },
    CIH: {
      accountName: "CIH BANK",
      iban: "MA64 011 519 0000001210001234 56",
      swift: "CIHWMAMC",
      bankAddress: "187, Avenue Hassan II, Casablanca, Morocco",
      accountDetails: "Account number: 007 640 0001210001234567",
      rib: "007640000121000123456789",
      currency: "MAD"
    }
  }[bankId];

  if (!bankInfo) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-medium text-gray-900 mb-3">Bank Details</h4>
      <div className="space-y-2 text-sm">
        <p><span className="font-medium">Account Name:</span> {bankInfo.accountName}</p>
        <p><span className="font-medium">IBAN:</span> {bankInfo.iban}</p>
        <p><span className="font-medium">SWIFT/BIC:</span> {bankInfo.swift}</p>
        <p><span className="font-medium">Bank Address:</span> {bankInfo.bankAddress}</p>
        <p><span className="font-medium">Account Details:</span> {bankInfo.accountDetails}</p>
        {bankInfo.rib && <p><span className="font-medium">RIB:</span> {bankInfo.rib}</p>}
        <p><span className="font-medium">Currency:</span> {bankInfo.currency}</p>
      </div>
    </div>
  );
};

interface MultiQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: QuotationData[];
  onProceedToPayment?: (selectedQuotations: QuotationData[], paymentMethod: string) => void;
}

const MultiQuotationModal: React.FC<MultiQuotationModalProps> = ({
  isOpen,
  onClose,
  quotations = [],
  onProceedToPayment,
}) => {
  const { user } = useAuth();
  const [selectedQuotations, setSelectedQuotations] = useState<QuotationData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>(() => {
    const initialOptions: Record<string, number> = {};
    quotations.forEach((quotation) => {
      initialOptions[quotation.id] = quotation.selected_option || 1;
    });
    return initialOptions;
  });

  // Filter for approved quotations only
  const approvedQuotations = quotations.filter(q => q.status === "Approved");

  const handleOptionChange = (quotationId: string, optionIndex: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [quotationId]: optionIndex
    }));

    setSelectedQuotations(prev => 
      prev.map(q => 
        q.id === quotationId 
          ? { ...q, selected_option: optionIndex }
          : q
      )
    );
  };

  const toggleQuotationSelection = (quotation: QuotationData) => {
    setSelectedQuotations((prev) =>
      prev.some((q) => q.id === quotation.id)
        ? prev.filter((q) => q.id !== quotation.id)
        : [...prev, quotation]
    );
  };

  const handleSelectAll = () => {
    setSelectedQuotations(approvedQuotations);
  };

  const handleDeselectAll = () => {
    setSelectedQuotations([]);
  };

  const calculateTotalPrice = () => {
    return selectedQuotations.reduce((total, quotation) => {
      const selectedOption = selectedOptions[quotation.id];
      if (selectedOption && quotation.priceOptions) {
        const price = quotation.priceOptions[selectedOption - 1]?.price;
        const numericPrice = typeof price === 'string' 
          ? parseFloat(price.replace(/[^0-9.-]+/g, ""))
          : 0;
        return total + numericPrice;
      }
      return total;
    }, 0);
  };

  const generateReferenceNumber = () => {
    const timestamp = new Date().getTime().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  };

  const handleProceedToPayment = async () => {
    try {
      if (selectedQuotations.length === 0) {
        alert("Please select at least one quotation to proceed.");
        return;
      }

      if (!selectedPaymentMethod) {
        alert("Please select a payment method to proceed.");
        return;
      }

      if (!user?.id) {
        alert("Please login to proceed with payment.");
        return;
      }

      setIsProcessing(true);

      // Get the selected payment method details
      const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod);
      if (!selectedMethod) {
        throw new Error("Invalid payment method selected");
      }

      const totalAmount = calculateTotalPrice();
      const referenceNumber = generateReferenceNumber();

      // Ensure we have valid UUIDs for all selected quotations
      const quotationUuids = selectedQuotations.map(q => {
        // If id is a UUID, use it directly
        if (q.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q.id)) {
          return q.id;
        }
        // If id starts with QT-, it's a display ID, so we need to extract the actual UUID from somewhere else
        // For now, we'll throw an error if we can't find a valid UUID
        throw new Error(`Invalid quotation ID format: ${q.id}`);
      });

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          user_id: user.id,
          total_amount: totalAmount.toString(),
          method: selectedMethod.name,
          status: 'pending',
          quotation_ids: quotationUuids,
          reference_number: referenceNumber,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (paymentError) {
        console.error("Payment Error:", paymentError);
        throw new Error("Failed to create payment record. Please try again.");
      }

      if (!payment) {
        throw new Error("Failed to create payment record");
      }

      // Update quotations with payment reference
      const updatePromises = selectedQuotations.map(quotation => {
        const quotationId = quotation.id;
        // Skip if not a valid UUID
        if (!quotationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quotationId)) {
          console.error(`Invalid quotation ID for update: ${quotationId}`);
          return Promise.resolve();
        }
        
        return supabase
          .from('quotations')
          .update({ 
            payment_id: payment.id,
            selected_option: selectedOptions[quotation.id] || quotation.selected_option || 1
          })
          .eq('id', quotationId);
      });

      await Promise.all(updatePromises.filter(Boolean));

      // Call the optional callback if provided
      if (onProceedToPayment) {
        onProceedToPayment(selectedQuotations, selectedPaymentMethod);
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error processing payment:", error);
      alert(error instanceof Error ? error.message : "There was an error processing your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="flex items-center justify-between p-6 border-b">
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Select Approved Quotations for Payment
          </DialogTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <CloseIcon className="w-6 h-6 text-gray-500" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {approvedQuotations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No approved quotations available for payment.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {approvedQuotations.length} approved quotation(s) available
                </p>
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleSelectAll}
                    className="text-sm"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeselectAll}
                    className="text-sm"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {approvedQuotations.map((quotation) => {
                  const isSelected = selectedQuotations.some((q) => q.id === quotation.id);
                  const currentOption = selectedOptions[quotation.id];
                  const selectedPrice = currentOption && quotation.priceOptions
                    ? quotation.priceOptions[currentOption - 1]?.price
                    : 0;

                  return (
                    <div
                      key={quotation.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleQuotationSelection(quotation)}
                              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div>
                              <h3 className="font-medium text-gray-900">
                                Quotation {quotation.quotation_id || quotation.id}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {quotation.product?.name || "Unnamed Product"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge
                              variant="light"
                              color="success"
                            >
                              Approved
                            </Badge>
                            <span className="font-semibold text-gray-900">
                              {selectedPrice || '$0.00'}
                            </span>
                          </div>
                        </div>

                        {quotation.priceOptions && (
                          <div className="ml-9 grid grid-cols-1 gap-2">
                            {quotation.priceOptions.map((option, index) => (
                              <label
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  currentOption === index + 1
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="radio"
                                    name={`option-${quotation.id}`}
                                    checked={currentOption === index + 1}
                                    onChange={() => handleOptionChange(quotation.id, index + 1)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">
                                      Option {index + 1}: {option.supplier}
                                    </span>
                                    {option.description && (
                                      <span className="text-xs text-gray-500">
                                        {option.description}
                                      </span>
                                    )}
                                    {option.deliveryTime && (
                                      <span className="text-xs text-gray-500">
                                        Delivery: {option.deliveryTime}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                  {option.price || '$0.00'}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${calculateTotalPrice().toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {PAYMENT_METHODS.map((method) => (
                      <div key={method.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`w-full p-4 text-left border rounded-lg transition-all ${
                            selectedPaymentMethod === method.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{method.icon}</span>
                              <span className="font-medium">{method.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">{method.currency}</span>
                          </div>
                        </button>
                        {selectedPaymentMethod === method.id && (
                          <BankInformation bankId={method.id} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t p-6 bg-white">
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedToPayment}
              disabled={selectedQuotations.length === 0 || !selectedPaymentMethod || isProcessing}
              className="px-6"
            >
              {isProcessing ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiQuotationModal; 
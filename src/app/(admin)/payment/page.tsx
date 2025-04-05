"use client";

import { useEffect, useState } from "react";
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
import { Modal } from "@/components/ui/modal";
import { CloseIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";

// Sample payment data
const paymentData = [
  {
    id: "MES-00001",
    orderId: "MES-00001",
    amount: "$12,500",
    method: "Bank Transfer",
    date: "2023-12-15",
    status: "Completed",
    client: {
      name: "Acme Industries",
      email: "contact@acme.com"
    },
    invoiceNo: "INV-2023-001"
  },
  {
    id: "MES-00002",
    orderId: "MES-00002",
    amount: "$8,750",
    method: "Bank Transfer",
    date: "2023-12-18",
    status: "Completed",
    client: {
      name: "Global Manufacturing",
      email: "orders@globalmanufacturing.com"
    },
    invoiceNo: "INV-2023-002"
  },
  {
    id: "MES-00003",
    orderId: "MES-00003",
    amount: "$15,200",
    method: "Bank Transfer",
    date: "2023-12-20",
    status: "Completed",
    client: {
      name: "Tech Solutions Inc.",
      email: "procurement@techsolutions.com"
    },
    invoiceNo: "INV-2023-003"
  },
  {
    id: "MES-00004",
    orderId: "MES-00004",
    amount: "$22,500",
    method: "Bank Transfer",
    date: "2023-12-22",
    status: "Pending",
    client: {
      name: "Electron Devices",
      email: "supplies@electrondevices.com"
    },
    invoiceNo: "INV-2023-004"
  },
  {
    id: "MES-00005",
    orderId: "MES-00005",
    amount: "$5,800",
    method: "Bank Transfer",
    date: "2023-12-25",
    status: "Rejected",
    client: {
      name: "Construction Partners",
      email: "materials@constructionpartners.com"
    },
    invoiceNo: "INV-2023-005"
  }
];

// Define payment data type
interface PaymentDataType {
  id: string;
  orderId: string;
  amount: string;
  method: string;
  date: string;
  status: string;
  client: {
    name: string;
    email: string;
  };
  invoiceNo: string;
}

export default function PaymentPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDataType | null>(null);
  const { isOpen: isPaymentModalOpen, openModal: openPaymentModal, closeModal: closePaymentModal } = useModal();
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  useEffect(() => {
    // Get status from URL parameter
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    
    if (status) {
      setStatusFilter(status);
      setShowStatusAlert(true);
      
      // Clear the URL parameter after a delay
      setTimeout(() => {
        window.history.replaceState({}, '', '/payment');
      }, 5000);
    }
  }, []);

  // Function to handle contact support
  const handleContactSupport = () => {
    window.open('mailto:support@example.com', '_blank');
  };

  const getStatusBadgeColor = (status: string): "primary" | "success" | "warning" | "info" | "error" => {
    switch (status) {
      case "Completed":
        return "success";
      case "Pending":
        return "warning";
      case "Rejected":
        return "error";
      default:
        return "primary";
    }
  };

  // Handle view payment details
  const handleViewPayment = (payment: PaymentDataType) => {
    setSelectedPayment(payment);
    openPaymentModal();
  };

  // Handle bank selection
  const handleBankSelection = (bank: string) => {
    setSelectedBank(bank);
  };

  // Handle download invoice
  const handleDownloadInvoice = (payment: PaymentDataType) => {
    // Create a simple invoice content
    const invoiceContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice ${payment.invoiceNo}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
        .invoice-box table { width: 100%; line-height: 1.6; text-align: left; }
        .invoice-box table td { padding: 5px; vertical-align: top; }
        .invoice-box table tr.top table td { padding-bottom: 20px; }
        .invoice-box table tr.top table td.title { font-size: 45px; color: #0D47A1; }
        .invoice-box table tr.information table td { padding-bottom: 40px; }
        .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
        .invoice-box table tr.details td { padding-bottom: 20px; }
        .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
        .invoice-box table tr.item.last td { border-bottom: none; }
        .invoice-box table tr.total td:nth-child(2) { font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <table cellpadding="0" cellspacing="0">
          <tr class="top">
            <td colspan="2">
              <table>
                <tr>
                  <td class="title">
                    morocco ecom source
                  </td>
                  <td class="text-right">
                    Invoice #: ${payment.invoiceNo}<br>
                    Payment ID: ${payment.id}<br>
                    Date: ${payment.date}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr class="information">
            <td colspan="2">
              <table>
                <tr>
                  <td>
                    MES, Inc.<br>
                    12345 Business Park<br>
                    Casablanca, Morocco
                  </td>
                  <td class="text-right">
                    ${payment.client.name}<br>
                    ${payment.client.email}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr class="heading">
            <td>Payment Method</td>
            <td class="text-right">Amount</td>
          </tr>
          
          <tr class="details">
            <td>${payment.method}</td>
            <td class="text-right">${payment.amount}</td>
          </tr>
          
          <tr class="heading">
            <td>Item</td>
            <td class="text-right">Price</td>
          </tr>
          
          <tr class="item">
            <td>Industrial Equipment Order #${payment.orderId}</td>
            <td class="text-right">${payment.amount}</td>
          </tr>
          
          <tr class="total">
            <td></td>
            <td class="text-right">Total: ${payment.amount}</td>
          </tr>
        </table>
        <div class="text-center" style="margin-top: 40px; color: #888;">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Create a blob and download link
    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${payment.invoiceNo}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Status Alert Notification */}
      {showStatusAlert && (
        <div className="col-span-12">
          {statusFilter === 'pending' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Payment Pending Approval</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Your payment is being processed and needs approval from our support team. Please complete the bank transfer and submit a receipt to expedite the process.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {statusFilter === 'approved' && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Payment Approved</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your payment has been approved and processed successfully. You can view the transaction details below.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {statusFilter === 'rejected' && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Payment Rejected</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Your payment could not be processed. Please contact our support team for assistance.</p>
                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={handleContactSupport}
                      >
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Page Header Section */}
      <div className="col-span-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[#0D47A1] dark:text-white/90">
            Payment Management
          </h1>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="col-span-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {/* Total Revenue */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <svg className="text-[#0D47A1]" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total Revenue
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                $64,750
              </h4>
            </div>
          </div>

          {/* Completed Payments */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <svg className="text-[#0D47A1]" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Completed Payments
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                78
              </h4>
            </div>
          </div>

          {/* Pending Payments */}
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
                Pending Payments
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                15
              </h4>
            </div>
          </div>

          {/* Rejected Payments */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <svg className="text-[#0D47A1]" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 3L14.5 21C14.4605 21.0796 14.4022 21.1474 14.3305 21.1969C14.2588 21.2464 14.1759 21.2761 14.09 21.2831C14.0041 21.29 13.9179 21.2739 13.8405 21.2364C13.763 21.1989 13.6969 21.1412 13.65 21.07L10 14L2.92996 10.35C2.85975 10.3029 2.80213 10.2368 2.76464 10.1594C2.72715 10.0819 2.71091 9.99582 2.71791 9.90992C2.7249 9.82402 2.75454 9.74117 2.80401 9.66948C2.85349 9.59779 2.9213 9.53942 3.00001 9.5L21 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Rejected Payments
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                7
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Table Section */}
      <div className="col-span-12">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
            <h3 className="font-semibold text-[#0D47A1] text-base dark:text-white/90">
              Payment Management
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search payments..."
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
              <Button variant="outline" size="sm" className="text-[#1E88E5] border-[#64B5F6] hover:bg-[#E3F2FD]">
                Export
              </Button>
            </div>
          </div>

          {/* Payment Table */}
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
                      Payment ID
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Order ID
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Amount
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Method
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
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody>
                  {paymentData.map((payment, index) => (
                    <TableRow
                      key={index}
                      className="border-b border-gray-100 last:border-b-0 dark:border-white/[0.05] dark:bg-transparent dark:text-white transition-all duration-300 hover:bg-[#E3F2FD] hover:shadow-md cursor-pointer transform hover:translate-x-1 hover:scale-[1.01]"
                    >
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {payment.id}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {payment.orderId}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm font-medium">
                        {payment.amount}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {payment.method}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {payment.date}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <Badge color={getStatusBadgeColor(payment.status)} size="sm">
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300"
                            onClick={() => handleViewPayment(payment)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300"
                            onClick={() => handleDownloadInvoice(payment)}
                          >
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        showCloseButton={false}
        className="max-w-4xl h-auto mx-auto p-0 overflow-hidden"
      >
        {selectedPayment && (
          <div className="relative w-full bg-white dark:bg-gray-900 rounded-3xl animate-fade-in">
            <div className="p-6 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0D47A1] dark:text-white">Payment {selectedPayment.id}</h2>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-500">Invoice: {selectedPayment.invoiceNo}</span>
                    <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedPayment.status === 'Completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                        : selectedPayment.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
                    }`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={closePaymentModal}
                  className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
              
            <div className="space-y-6 px-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Payment Information</h3>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-4">
                    <div className="p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-[#0D47A1] dark:text-blue-400">{selectedPayment.amount}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Amount</div>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Payment ID</span>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">{selectedPayment.id}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Order ID</span>
                        <p className="text-gray-800 dark:text-gray-200">{selectedPayment.orderId}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Payment Method</span>
                        <p className="text-gray-800 dark:text-gray-200">{selectedPayment.method}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Payment Date</span>
                        <p className="text-gray-800 dark:text-gray-200">{selectedPayment.date}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Client Information</h3>
                <div className="p-5 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Client Name</span>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">{selectedPayment.client.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Client Email</span>
                      <p className="text-gray-800 dark:text-gray-200">{selectedPayment.client.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPayment.status === "Pending" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">Payment Methods</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Awaiting Payment</span>
                  </div>
                  <div className="space-y-4">
                    {/* WISE BANK */}
                    <div 
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedBank === 'wise' ? 'border-blue-500 ring-2 ring-blue-300 shadow-md' : 'hover:border-blue-300'
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
                        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Account Name</p>
                              <p className="font-medium">MEHDI AMADOUR</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Account Number</p>
                              <p className="font-medium">12345678900</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400">IBAN</p>
                            <p className="font-medium">GB29 NWBK 6016 1331 9268 19</p>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400">SWIFT/BIC</p>
                            <p className="font-medium">TRWIGB22XXX</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Other banks (collapsed for brevity) */}
                    <div 
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedBank === 'sg' ? 'border-blue-500 ring-2 ring-blue-300 shadow-md' : 'hover:border-blue-300'
                      }`}
                      onClick={() => handleBankSelection('sg')}
                    >
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            checked={selectedBank === 'sg'}
                            onChange={() => handleBankSelection('sg')}
                            className="w-4 h-4 text-blue-600 border-gray-300"
                          />
                          <div className="ml-2 font-semibold">SOCIETE GENERALE BANK</div>
                        </div>
                      </div>
                      {selectedBank === 'sg' && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                          {/* Bank details content */}
                        </div>
                      )}
                    </div>

                    <div 
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedBank === 'cih' ? 'border-blue-500 ring-2 ring-blue-300 shadow-md' : 'hover:border-blue-300'
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
                        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                          {/* Bank details content */}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 text-sm text-yellow-600 dark:text-yellow-500 text-center">
                    <p>After transferring the payment amount, please provide the transfer receipt to expedite order processing.</p>
                  </div>
                </div>
              )}
                
              {selectedPayment.status === "Completed" && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-700 dark:text-green-400 font-semibold text-lg mb-2">Payment Completed</p>
                  <p className="text-sm text-green-600 dark:text-green-500">This payment has been successfully processed and recorded in our system.</p>
                </div>
              )}
                
              {selectedPayment.status === "Rejected" && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-red-700 dark:text-red-400 font-semibold text-lg mb-2">Payment Rejected</p>
                  <p className="text-sm text-red-600 dark:text-red-500 mb-4">This payment could not be processed. Please contact our support team for assistance.</p>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={handleContactSupport}
                  >
                    Contact Support
                  </button>
                </div>
              )}
            </div>
                
            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300"
                onClick={closePaymentModal}
              >
                Close
              </Button>
                  
              {selectedPayment.status !== "Pending" && (
                <Button
                  size="sm"
                  className="bg-[#1E88E5] hover:bg-[#0D47A1] text-white"
                  onClick={() => handleDownloadInvoice(selectedPayment)}
                >
                  Download Invoice
                </Button>
              )}
                  
              {selectedPayment.status === "Pending" && (
                <Button
                  size="sm"
                  className="bg-[#1E88E5] hover:bg-[#0D47A1] text-white"
                  disabled={!selectedBank}
                >
                  Complete Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
} 
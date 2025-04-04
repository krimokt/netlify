"use client";

import { useState } from "react";
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

// Sample product images
const productImages = [
  "/images/product/product-01.jpg",
  "/images/product/product-02.jpg",
  "/images/product/product-03.jpg",
  "/images/product/product-04.jpg",
  "/images/product/product-05.jpg",
];

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
}

// Sample quotation data
const quotationData: QuotationData[] = [
  {
    id: "QT-2024-001",
    product: {
      name: "Industrial Water Pump",
      image: productImages[0],
      category: "Industrial Equipment",
      description: "Industrial grade water pump designed for heavy-duty applications. Suitable for commercial and industrial usage with high pressure capabilities."
    },
    quantity: "50 units",
    date: "2024-03-10",
    status: "Pending",
    shippingMethod: "Sea Freight",
    destination: "Shanghai, China",
    priceOptions: []  // Empty because it's pending and waiting for supplier prices
  },
  {
    id: "QT-2024-002",
    product: {
      name: "CNC Machine Parts",
      image: productImages[1],
      category: "Manufacturing",
      description: "Precision CNC machine components for industrial automation systems."
    },
    quantity: "200 units",
    date: "2024-03-12",
    status: "Pending",
    price: "Waiting for prices from supplier",
    shippingMethod: "Air Freight",
    destination: "Berlin, Germany",
    priceOptions: [
      { 
        id: "price1", 
        price: "$12,500", 
        supplier: "Premium Machinery Co.", 
        deliveryTime: "4-6 weeks",
        description: "High quality parts with extended warranty"
      },
      { 
        id: "price2", 
        price: "$10,800", 
        supplier: "Industrial Components Ltd.", 
        deliveryTime: "5-7 weeks" 
      },
      { 
        id: "price3", 
        price: "$9,650", 
        supplier: "Global Manufacturing Solutions", 
        deliveryTime: "6-8 weeks",
        description: "Standard quality with regular warranty" 
      }
    ]
  },
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
    price: "$15,200",
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
        modelImage: "/images/product/product-01.jpg"
      },
      { 
        id: "premium", 
        price: "USD 15,000", 
        supplier: "Premium Supplier Co.", 
        deliveryTime: "3-5 weeks",
        description: "Premium model with optimizers for better performance",
        modelName: "Premium Model with Optimizers",
        modelImage: "/images/product/product-02.jpg"
      },
      { 
        id: "premium-warranty", 
        price: "USD 16,500", 
        supplier: "Premium Supplier Co.", 
        deliveryTime: "3-5 weeks",
        description: "Premium model with extended warranty and priority support",
        modelName: "Premium Model with Extended Warranty",
        modelImage: "/images/product/product-03.jpg"
      }
    ]
  },
  {
    id: "QT-2024-004",
    product: {
      name: "Solar Panels",
      image: productImages[3],
      category: "Renewable Energy",
      description: "High-efficiency solar panels with 25-year warranty."
    },
    quantity: "100 units",
    date: "2024-03-18",
    status: "Rejected",
    price: "$22,500",
    shippingMethod: "Sea Freight",
    destination: "Cape Town, South Africa"
  },
  {
    id: "QT-2024-005",
    product: {
      name: "Conveyor Systems",
      image: productImages[4],
      category: "Material Handling",
      description: "Industrial conveyor systems for warehouse and manufacturing facilities."
    },
    quantity: "5 units",
    date: "2024-03-20",
    status: "Pending",
    price: "Waiting for prices from supplier",
    shippingMethod: "Train Freight",
    destination: "Paris, France",
    priceOptions: [
      { 
        id: "price1", 
        price: "$18,300", 
        supplier: "European Logistics Ltd.", 
        deliveryTime: "3-5 weeks" 
      },
      { 
        id: "price2", 
        price: "$16,750", 
        supplier: "Global Transport Solutions", 
        deliveryTime: "4-6 weeks",
        description: "Includes installation support" 
      }
    ]
  }
];

export default function QuotationPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationData | null>(null);

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
                126
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
                85
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
                32
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
                9
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
                  {quotationData.map((item) => (
                    <TableRow 
                      key={item.id}
                      className="transition-all duration-300 hover:bg-[#E3F2FD] hover:shadow-md cursor-pointer transform hover:translate-x-1 hover:scale-[1.01]"
                    >
                      <TableCell className="px-5 py-4 text-gray-700 text-start text-theme-sm dark:text-white/90">
                        {item.id}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-lg">
                            <Image
                              width={40}
                              height={40}
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
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
              Showing 1-5 of 126 items
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
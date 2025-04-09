"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowUpIcon, 
  BoxIconLine, 
  GroupIcon, 
  PaperPlaneIcon,
  DollarLineIcon
} from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import ShippingTracking from "@/components/shipping/ShippingTracking";
import QuotationFormModal from "@/components/quotation/QuotationFormModal";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Define the type for quotation data
interface QuotationItem {
  id: string;
  product: {
    name: string;
    image: string;
  };
  quantity: string;
  date: string;
  status: string;
}

// Sample data for the recent orders requests table
const ordersData = [
  {
    id: "OR-2001",
    product: {
      name: "Industrial Valves",
      image: "/images/product/product-04.jpg"
    },
    quantity: "20 units",
    date: "2023-12-14",
    status: "Shipped"
  },
  {
    id: "OR-2002",
    product: {
      name: "Electric Motors",
      image: "/images/product/product-05.jpg"
    },
    quantity: "10 units",
    date: "2023-12-17",
    status: "Processing"
  },
  {
    id: "OR-2003",
    product: {
      name: "Control Panels",
      image: "/images/product/product-01.jpg"
    },
    quantity: "5 units",
    date: "2023-12-19",
    status: "Delivered"
  }
];

export default function DashboardHome() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quotationData, setQuotationData] = useState<QuotationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch real quotation data from Supabase
  useEffect(() => {
    async function fetchQuotations() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('quotations')
          .select('id, quotation_id, product_name, quantity, created_at, status')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (error) {
          console.error("Error fetching quotations:", error);
          return;
        }
        
        // Transform data to match the format expected by the component
        const formattedData = data.map(item => ({
          id: item.quotation_id,
          product: {
            name: item.product_name,
            image: "/images/product/product-01.jpg" // Default image
          },
          quantity: `${item.quantity} units`,
          date: new Date(item.created_at).toLocaleDateString(),
          status: item.status
        }));
        
        setQuotationData(formattedData);
      } catch (error) {
        console.error("Exception fetching quotations:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchQuotations();
  }, [isModalOpen]); // Refetch when modal closes (possibly after creating a new quote)

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  // Navigation functions
  const goToQuotationsPage = () => router.push('/quotation');
  const goToOrdersPage = () => router.push('/order');
  const goToShipmentTrackingPage = () => router.push('/shipment-tracking');
  
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Metric Cards Section */}
      <div className="col-span-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {/* Quotation Pending Metric */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <PaperPlaneIcon className="text-[#0D47A1] size-6" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Quotation Pending
                </span>
                <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                  24
                </h4>
              </div>
              <Badge color="warning">
                <ArrowUpIcon />
                8.5%
              </Badge>
            </div>
          </div>

          {/* Active Shipments Metric */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <BoxIconLine className="text-[#0D47A1] size-6" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Active Shipments
                </span>
                <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                  18
                </h4>
              </div>
              <Badge color="success">
                <ArrowUpIcon />
                12.3%
              </Badge>
            </div>
          </div>

          {/* Delivered Products Metric */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <GroupIcon className="text-[#0D47A1] size-6" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Delivered Products
                </span>
                <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                  182
                </h4>
              </div>
              <Badge color="success">
                <ArrowUpIcon />
                15.2%
              </Badge>
            </div>
          </div>

          {/* Total Spend Metric */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <DollarLineIcon className="text-[#0D47A1] size-6" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total Spend
                </span>
                <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                  $234,500
                </h4>
              </div>
              <Badge color="success">
                <ArrowUpIcon />
                9.7%
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quotations Requests Table */}
      <div className="col-span-12 lg:col-span-6">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
            <h3 className="font-semibold text-[#0D47A1] text-base dark:text-white/90">
              Recent Quotation Requests
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="primary" 
                size="sm" 
                className="bg-[#1E88E5] hover:bg-[#0D47A1]"
                onClick={openModal}
              >
                Create New Quote
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[#1E88E5] border-[#64B5F6] hover:bg-[#E3F2FD]"
                onClick={goToQuotationsPage}
              >
                View All
              </Button>
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
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {isLoading && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-gray-500 text-center">
                        Loading latest quotations...
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {!isLoading && quotationData.length === 0 && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-gray-500 text-center">
                        No quotations found
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {!isLoading && quotationData.map((item) => (
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
                              : item.status === "Processing"
                              ? "warning"
                              : "primary"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Requests Table */}
      <div className="col-span-12 lg:col-span-6">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
            <h3 className="font-semibold text-[#0D47A1] text-base dark:text-white/90">
              Recent Orders Requests
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[#1E88E5] border-[#64B5F6] hover:bg-[#E3F2FD]"
                onClick={goToOrdersPage}
              >
                View All
              </Button>
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
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {ordersData.map((item) => (
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
                            item.status === "Delivered"
                              ? "success"
                              : item.status === "Processing"
                              ? "warning"
                              : item.status === "Shipped"
                              ? "primary"
                              : "error"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Tracking Section */}
      <div className="col-span-12">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
            <h3 className="font-semibold text-[#0D47A1] text-base dark:text-white/90">
              Shipment Tracking
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="primary" 
                size="sm" 
                className="bg-[#1E88E5] hover:bg-[#0D47A1]"
                onClick={goToShipmentTrackingPage}
              >
                View All Shipments
              </Button>
            </div>
          </div>

          {/* Tracking Table */}
          <div className="px-5 pb-6">
            <ShippingTracking />
          </div>
        </div>
      </div>

      {/* Quotation Form Modal */}
      <QuotationFormModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
} 
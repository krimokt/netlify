"use client";

import React, { useState } from "react";
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

// Define proper interfaces
interface ClientInfo {
  name: string;
  phone: string;
  address: string;
}

interface Product {
  name: string;
  image: string;
}

interface Order {
  id: string;
  product: Product;
  quantity: string;
  date: string;
  status: string;
  amount: string;
  clientInfo: ClientInfo;
}

// Sample product images
const productImages = [
  "/images/product/product-01.jpg",
  "/images/product/product-02.jpg",
  "/images/product/product-03.jpg",
  "/images/product/product-04.jpg",
  "/images/product/product-05.jpg",
];

// Sample order data
const orderData: Order[] = [
  {
    id: "MES-00001",
    product: {
      name: "Industrial Water Pump",
      image: productImages[0],
    },
    quantity: "2 units",
    date: "2023-12-15",
    status: "Processing",
    amount: "$12,500",
    clientInfo: {
      name: "Acme Industries",
      phone: "+1 555-123-4567",
      address: "123 Industrial Blvd, New York, NY 10001",
    }
  },
  {
    id: "MES-00002",
    product: {
      name: "Electric Motors",
      image: productImages[2],
    },
    quantity: "5 units",
    date: "2023-12-18",
    status: "Shipped",
    amount: "$8,750",
    clientInfo: {
      name: "Global Manufacturing",
      phone: "+1 555-987-6543",
      address: "456 Factory Ave, Chicago, IL 60007",
    }
  },
  {
    id: "MES-00003",
    product: {
      name: "Solar Panel System",
      image: productImages[3],
    },
    quantity: "1 system",
    date: "2023-12-20",
    status: "Delivered",
    amount: "$15,200",
    clientInfo: {
      name: "Tech Solutions Inc.",
      phone: "+1 555-789-0123",
      address: "789 Tech Park, San Francisco, CA 94105",
    }
  },
  {
    id: "MES-00004",
    product: {
      name: "Industrial Air Compressor",
      image: productImages[4],
    },
    quantity: "3 units",
    date: "2023-12-22",
    status: "Waiting for information",
    amount: "$22,500",
    clientInfo: {
      name: "",
      phone: "",
      address: "",
    }
  },
  {
    id: "MES-00005",
    product: {
      name: "Control Panel",
      image: productImages[1],
    },
    quantity: "2 units",
    date: "2023-12-25",
    status: "Processing",
    amount: "$5,800",
    clientInfo: {
      name: "Construction Partners",
      phone: "+1 555-456-7890",
      address: "321 Building St, Dallas, TX 75001",
    }
  }
];

export default function OrderPage() {
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    phone: "",
    address: ""
  });

  // Map status to component supported badge colors (primary, success, error, warning, info, light, dark)
  const getStatusBadgeColor = (status: string): "primary" | "success" | "warning" | "info" | "error" => {
    switch (status) {
      case "Delivered":
        return "success";
      case "Shipped":
        return "info";
      case "Processing":
        return "warning";
      case "Waiting for information":
        return "error";
      default:
        return "primary";
    }
  };

  const handleShippingInfoSubmit = () => {
    // Here you would typically send this data to your backend
    // For this demo, we'll just update our local state
    if (selectedOrder) {
      const updatedOrderData = orderData.map(order => {
        if (order.id === selectedOrder.id) {
          return {
            ...order,
            status: "Processing", // Change status after info is provided
            clientInfo: {
              name: shippingInfo.name,
              phone: shippingInfo.phone,
              address: shippingInfo.address
            }
          };
        }
        return order;
      });
      
      // In a real app, you'd update the backend here
      console.log("Updated order data:", updatedOrderData);
      
      // Reset and close modal
      setShowShippingModal(false);
      setSelectedOrder(null);
      setShippingInfo({
        name: "",
        phone: "",
        address: ""
      });
    }
  };

  const openShippingModal = (order: Order) => {
    setSelectedOrder(order);
    setShippingInfo({
      name: order.clientInfo.name || "",
      phone: order.clientInfo.phone || "",
      address: order.clientInfo.address || ""
    });
    setShowShippingModal(true);
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Page Header Section */}
      <div className="col-span-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[#0D47A1] dark:text-white/90">
            Order Management
          </h1>
        </div>
      </div>

      {/* Order Summary Cards */}
      <div className="col-span-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {/* Total Orders */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <svg className="text-[#0D47A1]" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5 14.25V10.5C19.5 6.34784 19.0312 5.25 15 5.25C10.9688 5.25 10.5 6.34784 10.5 10.5V14.25H8.25C7.85218 14.25 7.47064 14.408 7.18934 14.6893C6.90804 14.9706 6.75 15.3522 6.75 15.75V18.75C6.75 19.1478 6.90804 19.5294 7.18934 19.8107C7.47064 20.092 7.85218 20.25 8.25 20.25H21.75C22.1478 20.25 22.5294 20.092 22.8107 19.8107C23.092 19.5294 23.25 19.1478 23.25 18.75V15.75C23.25 15.3522 23.092 14.9706 22.8107 14.6893C22.5294 14.408 22.1478 14.25 21.75 14.25H19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 14.25C16.0355 14.25 16.875 13.4105 16.875 12.375C16.875 11.3395 16.0355 10.5 15 10.5C13.9645 10.5 13.125 11.3395 13.125 12.375C13.125 13.4105 13.9645 14.25 15 14.25Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total Orders
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                142
              </h4>
            </div>
          </div>

          {/* Delivered Orders */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <svg className="text-[#0D47A1]" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Delivered Orders
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                54
              </h4>
            </div>
          </div>

          {/* Processing Orders */}
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
                Processing Orders
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                68
              </h4>
            </div>
          </div>

          {/* Waiting for Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-[#E3F2FD] rounded-xl">
              <svg className="text-[#0D47A1]" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Waiting for Information
              </span>
              <h4 className="mt-2 font-bold text-[#0D47A1] text-title-sm dark:text-white/90">
                20
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Order Table Section */}
      <div className="col-span-12">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
            <h3 className="font-semibold text-[#0D47A1] text-base dark:text-white/90">
              Order Management
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search orders..."
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
                      Order ID
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
                      Order Date
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
                      Total Amount
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
                  {orderData.map((order, index) => (
                    <TableRow
                      key={index}
                      className="border-b border-gray-100 last:border-b-0 dark:border-white/[0.05] dark:bg-transparent dark:text-white"
                    >
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {order.id}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                            <Image
                              src={order.product.image}
                              alt={order.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="font-medium">{order.product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {order.quantity}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {order.date}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <Badge color={getStatusBadgeColor(order.status)} size="sm">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {order.amount}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {order.status === "Waiting for information" ? (
                          <Button
                            size="sm"
                            className="bg-[#1E88E5] hover:bg-[#0D47A1] text-white"
                            onClick={() => openShippingModal(order)}
                          >
                            Add Information
                          </Button>
                        ) : order.status === "Shipped" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300"
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              className="bg-[#1E88E5] hover:bg-[#0D47A1] text-white"
                              onClick={() => window.location.href = `/shipment-tracking?orderId=${order.id}`}
                            >
                              View Details
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300"
                            >
                              View
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Information Modal */}
      {showShippingModal && selectedOrder && (
        <div className="fixed inset-0 z-[9999] backdrop-blur-md bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full shadow-2xl">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Shipping Information</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Order ID: {selectedOrder.id}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Receiver Name
                </label>
                <input
                  type="text"
                  value={shippingInfo.name}
                  onChange={(e) => setShippingInfo({...shippingInfo, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter receiver's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Receiver Phone Number
                </label>
                <input
                  type="text"
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Exact Address
                </label>
                <textarea
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter complete shipping address"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowShippingModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleShippingInfoSubmit}
                className="px-4 py-2 bg-[#1E88E5] text-white rounded-md hover:bg-[#0D47A1]"
                disabled={!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address}
              >
                Submit Information
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
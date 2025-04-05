"use client";

import React, { useState, useEffect } from "react";
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
import { Modal } from "@/components/ui/modal";

// Sample product images
const productImages = [
  "/images/product/product-01.jpg",
  "/images/product/product-02.jpg",
  "/images/product/product-03.jpg",
  "/images/product/product-04.jpg",
  "/images/product/product-05.jpg",
];

// Define the shipment tracking data type
interface ShipmentTrackingData {
  id: string;
  trackingNumber: string;
  orderId: string;
  product: {
    name: string;
    image: string;
  };
  origin: {
    country: string;
    name: string;
  };
  destination: {
    country: string;
    name: string;
  };
  currentLocation: {
    country: string;
    name: string;
  };
  status: string;
  dates: {
    shipment: string;
    estimated: string;
    delivered?: string;
  };
  price?: number;
  isPaid?: boolean;
}

// Sample shipment data
const shipmentData: ShipmentTrackingData[] = [
  {
    id: "ship-1",
    trackingNumber: "MES-TR-00001",
    orderId: "MES-00001",
    product: {
      name: "Industrial Water Pump",
      image: productImages[0],
    },
    origin: {
      country: "China",
      name: "Shenzhen",
    },
    destination: {
      country: "Morocco",
      name: "Casablanca",
    },
    currentLocation: {
      country: "Singapore",
      name: "Singapore Port",
    },
    status: "In Transit",
    dates: {
      shipment: "2023-12-15",
      estimated: "2024-01-20",
    },
    price: 3500,
    isPaid: false
  },
  {
    id: "ship-2",
    trackingNumber: "MES-TR-00002",
    orderId: "MES-00002",
    product: {
      name: "Electric Motors",
      image: productImages[2],
    },
    origin: {
      country: "China",
      name: "Shanghai",
    },
    destination: {
      country: "Morocco",
      name: "Casablanca",
    },
    currentLocation: {
      country: "Egypt",
      name: "Port Said",
    },
    status: "In Transit",
    dates: {
      shipment: "2023-12-18",
      estimated: "2024-01-25",
    },
    price: 2800,
    isPaid: false
  },
  {
    id: "ship-3",
    trackingNumber: "MES-TR-00003",
    orderId: "MES-00003",
    product: {
      name: "Solar Panel System",
      image: productImages[3],
    },
    origin: {
      country: "China",
      name: "Guangzhou",
    },
    destination: {
      country: "Morocco",
      name: "Casablanca",
    },
    currentLocation: {
      country: "Morocco",
      name: "Casablanca",
    },
    status: "Delivered",
    dates: {
      shipment: "2023-12-20",
      estimated: "2024-01-15",
      delivered: "2024-01-14",
    },
    price: 5200,
    isPaid: false
  },
  {
    id: "ship-4",
    trackingNumber: "MES-TR-00004",
    orderId: "MES-00004",
    product: {
      name: "Industrial Air Compressor",
      image: productImages[4],
    },
    origin: {
      country: "China",
      name: "Shenzhen",
    },
    destination: {
      country: "Morocco",
      name: "Casablanca",
    },
    currentLocation: {
      country: "Red Sea",
      name: "In Transit",
    },
    status: "Delayed",
    dates: {
      shipment: "2023-12-22",
      estimated: "2024-02-10",
    },
    price: 4100,
    isPaid: false
  },
];

export default function ShipmentTrackingPage() {
  const [selectedShipment, setSelectedShipment] = useState<ShipmentTrackingData | null>(null);
  const [filteredShipmentData, setFilteredShipmentData] = useState<ShipmentTrackingData[]>(shipmentData);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Effect to check URL parameters for order ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('orderId');
      
      if (orderId) {
        const shipment = shipmentData.find(s => s.orderId === orderId);
        if (shipment) {
          setSelectedShipment(shipment);
          setShowDetailsModal(true);
        }
      }
    }
  }, []);

  // Get status badge color
  const getStatusBadgeColor = (status: string): "primary" | "success" | "warning" | "info" | "error" => {
    switch (status) {
      case "Delivered":
        return "success";
      case "In Transit":
        return "primary";
      case "Processing":
        return "warning";
      case "Delayed":
        return "error";
      default:
        return "info";
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setFilteredShipmentData(shipmentData);
    } else {
      const filtered = shipmentData.filter(
        shipment => 
          shipment.trackingNumber.toLowerCase().includes(query) ||
          shipment.orderId.toLowerCase().includes(query) ||
          shipment.product.name.toLowerCase().includes(query)
      );
      setFilteredShipmentData(filtered);
    }
  };

  // View shipment details
  const viewShipmentDetails = (shipment: ShipmentTrackingData) => {
    setSelectedShipment(shipment);
    setShowDetailsModal(true);
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Page Header Section */}
      <div className="col-span-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[#0D47A1] dark:text-white/90">
            Shipment Tracking
          </h1>
        </div>
      </div>

      {/* Shipment Details Modal */}
      <Modal 
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        className="max-w-3xl p-8 mx-4 md:mx-auto"
      >
        {selectedShipment && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Shipment Details</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Tracking Number: {selectedShipment.trackingNumber}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="relative h-48 w-full overflow-hidden rounded-lg mb-4">
                  <Image
                    src={selectedShipment.product.image}
                    alt={selectedShipment.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold">{selectedShipment.product.name}</h3>
                <p className="text-gray-500">Order ID: {selectedShipment.orderId}</p>
                {selectedShipment.price && (
                  <p className="text-gray-700 font-medium mt-2">
                    Price: ${selectedShipment.price.toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    <Badge color={getStatusBadgeColor(selectedShipment.status)} size="sm">
                      {selectedShipment.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">Dates</p>
                  <p className="text-sm">
                    <span className="font-medium">Shipped:</span> {selectedShipment.dates.shipment}
                  </p>
                  {selectedShipment.status === "Delivered" ? (
                    <p className="text-sm">
                      <span className="font-medium">Delivered:</span> {selectedShipment.dates.delivered}
                    </p>
                  ) : (
                    <p className="text-sm">
                      <span className="font-medium">Estimated Delivery:</span> {selectedShipment.dates.estimated}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-100 rounded-md">
                <div className="text-gray-500 text-sm mb-1">Origin</div>
                <div className="font-medium text-[#0D47A1]">{selectedShipment.origin.country}</div>
                <div className="text-gray-700">{selectedShipment.origin.name}</div>
              </div>
              <div className="p-4 border border-gray-100 rounded-md">
                <div className="text-gray-500 text-sm mb-1">Current Location</div>
                <div className="font-medium text-[#ffb300]">{selectedShipment.currentLocation.country}</div>
                <div className="text-gray-700">{selectedShipment.currentLocation.name}</div>
              </div>
              <div className="p-4 border border-gray-100 rounded-md">
                <div className="text-gray-500 text-sm mb-1">Destination</div>
                <div className="font-medium text-[#43a047]">{selectedShipment.destination.country}</div>
                <div className="text-gray-700">{selectedShipment.destination.name}</div>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Main Table Section */}
      <div className="col-span-12">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
            <h3 className="font-semibold text-[#0D47A1] text-base dark:text-white/90">
              Shipment Tracking
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search by tracking #, order #, or product..."
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
                      Tracking Number
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
                      Product
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Origin
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Destination
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Current Location
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
                      Dates
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
                  {filteredShipmentData.map((shipment, index) => (
                    <TableRow
                      key={index}
                      className="border-b border-gray-100 last:border-b-0 dark:border-white/[0.05] dark:bg-transparent dark:text-white hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {shipment.trackingNumber}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {shipment.orderId}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                            <Image
                              src={shipment.product.image}
                              alt={shipment.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{shipment.product.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#0D47A1]">{shipment.origin.country}</span>
                          <span className="text-xs text-gray-500">{shipment.origin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#43a047]">{shipment.destination.country}</span>
                          <span className="text-xs text-gray-500">{shipment.destination.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#ffb300]">{shipment.currentLocation.country}</span>
                          <span className="text-xs text-gray-500">{shipment.currentLocation.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <Badge color={getStatusBadgeColor(shipment.status)} size="sm">
                          {shipment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Shipped: {shipment.dates.shipment}</span>
                          <span className="text-xs text-gray-500">
                            {shipment.status === "Delivered" 
                              ? `Delivered: ${shipment.dates.delivered}` 
                              : `Est. Delivery: ${shipment.dates.estimated}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300"
                            onClick={() => viewShipmentDetails(shipment)}
                          >
                            View Details
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
    </div>
  );
} 
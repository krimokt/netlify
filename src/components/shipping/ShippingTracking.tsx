"use client";

import React from "react";
import ShippingTrackingTable, { ShippingTrackingItem } from "./ShippingTrackingTable";
import Button from "../ui/button/Button";

// Sample tracking data
const sampleTrackingData: ShippingTrackingItem[] = [
  {
    id: "ship-1",
    trackingNumber: "TRK93821765",
    orderNumber: "ORD-5721",
    origin: {
      country: "China",
      name: "Shenzhen"
    },
    current: {
      country: "Singapore",
      name: "Singapore Port"
    },
    destination: {
      country: "Morocco",
      name: "Casablanca"
    },
    status: "In Transit"
  },
  {
    id: "ship-2",
    trackingNumber: "TRK75648321",
    orderNumber: "ORD-5689",
    origin: {
      country: "China",
      name: "Shanghai"
    },
    current: {
      country: "Egypt",
      name: "Port Said"
    },
    destination: {
      country: "Morocco",
      name: "Casablanca"
    },
    status: "In Transit"
  },
  {
    id: "ship-3",
    trackingNumber: "TRK12453789",
    orderNumber: "ORD-5432",
    origin: {
      country: "China",
      name: "Guangzhou"
    },
    current: {
      country: "Morocco",
      name: "Casablanca"
    },
    destination: {
      country: "Morocco",
      name: "Casablanca"
    },
    status: "Delivered"
  }
];

const ShippingTracking: React.FC = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <h3 className="font-semibold text-[#0D47A1] text-base dark:text-white/90">
          Shipment Tracking
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" className="bg-[#1E88E5] hover:bg-[#0D47A1]">
            View All Shipments
          </Button>
        </div>
      </div>

      {/* Tracking Table */}
      <div className="px-5 pb-6">
        <ShippingTrackingTable trackingData={sampleTrackingData} />
      </div>
    </div>
  );
};

export default ShippingTracking; 
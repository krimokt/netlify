"use client";

import React from "react";
import ShippingRouteMap, { ShippingRoute } from "./ShippingRouteMap";
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

// Convert tracking data to map routes
const mapRoutes: ShippingRoute[] = [
  {
    id: "route-1",
    origin: {
      country: "China",
      name: "Shenzhen",
      latLng: [22.5431, 114.0579] // Shenzhen coordinates
    },
    current: {
      country: "Singapore",
      name: "Singapore Port",
      latLng: [1.3521, 103.8198] // Singapore coordinates
    },
    destination: {
      country: "Morocco",
      name: "Casablanca",
      latLng: [33.5731, -7.5898] // Casablanca coordinates
    }
  },
  {
    id: "route-2",
    origin: {
      country: "China",
      name: "Shanghai",
      latLng: [31.2304, 121.4737] // Shanghai coordinates
    },
    current: {
      country: "Egypt",
      name: "Port Said",
      latLng: [31.2565, 32.2841] // Port Said coordinates
    },
    destination: {
      country: "Morocco",
      name: "Casablanca",
      latLng: [33.5731, -7.5898] // Casablanca coordinates
    }
  },
  {
    id: "route-3",
    origin: {
      country: "China",
      name: "Guangzhou",
      latLng: [23.1291, 113.2644] // Guangzhou coordinates
    },
    current: {
      country: "Morocco",
      name: "Casablanca",
      latLng: [33.5731, -7.5898] // Casablanca coordinates
    },
    destination: {
      country: "Morocco",
      name: "Casablanca",
      latLng: [33.5731, -7.5898] // Casablanca coordinates
    }
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

      {/* Map Section */}
      <div className="px-5 pb-6">
        <div className="w-full h-80 overflow-hidden border border-gray-200 rounded-xl dark:border-white/[0.05]">
          <ShippingRouteMap routes={mapRoutes} />
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
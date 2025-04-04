import type { Metadata } from "next";
import React from "react";
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

export const metadata: Metadata = {
  title: "Dashboard Home | MES Dashboard",
  description: "Dashboard home page with metrics and quotation requests",
};

// Sample data for the quotation requests table
const quotationData = [
  {
    id: "QR-1001",
    product: {
      name: "Steel Pipes",
      image: "/images/product/product-01.jpg"
    },
    quantity: "500 units",
    date: "2023-12-15",
    status: "Pending"
  },
  {
    id: "QR-1002",
    product: {
      name: "Aluminum Sheets",
      image: "/images/product/product-02.jpg"
    },
    quantity: "200 units",
    date: "2023-12-18",
    status: "Processing"
  },
  {
    id: "QR-1003",
    product: {
      name: "Copper Wires",
      image: "/images/product/product-03.jpg"
    },
    quantity: "1000 meters",
    date: "2023-12-20",
    status: "Completed"
  },
  {
    id: "QR-1004",
    product: {
      name: "Silicon Wafers",
      image: "/images/product/product-04.jpg"
    },
    quantity: "50 units",
    date: "2023-12-22",
    status: "Pending"
  },
  {
    id: "QR-1005",
    product: {
      name: "PVC Pipes",
      image: "/images/product/product-05.jpg"
    },
    quantity: "300 units",
    date: "2023-12-25",
    status: "Processing"
  }
];

export default function DashboardHome() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Metric Cards Section */}
      <div className="col-span-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {/* Quotation Pending Metric */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <PaperPlaneIcon className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Quotation Pending
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
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
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Active Shipments
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
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
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Delivered Products
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
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
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total Spend
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
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

      {/* Recent Quotation Requests Table */}
      <div className="col-span-12">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
            <h3 className="font-semibold text-gray-800 text-title-md dark:text-white/90">
              Recent Quotation Requests
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">
                New Quotation
              </Button>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[900px]">
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
                  {quotationData.map((item) => (
                    <TableRow key={item.id}>
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
                            item.status === "Completed"
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
    </div>
  );
} 
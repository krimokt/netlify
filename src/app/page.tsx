"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    // If authenticated, go to dashboard, otherwise to signin
    if (user) {
      console.log("User detected, redirecting to dashboard");
      router.push("/dashboard-home");
    } else {
      console.log("No user detected, redirecting to signin");
      router.push("/signin");
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Loading...</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Please wait while we redirect you.</p>
      </div>
    </div>
  );
} 
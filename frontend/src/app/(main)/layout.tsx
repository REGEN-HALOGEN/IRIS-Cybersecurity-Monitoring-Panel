"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Under Tauri, localStorage is much more stable than document.cookie
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      router.replace("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-transparent"><div className="animate-pulse">Loading...</div></div>;
  }

  return (
    <div className="flex h-screen flex-row bg-transparent">
      <Sidebar />
      <main className="flex-1 flex-col overflow-auto bg-transparent p-6">
        {children}
      </main>
    </div>
  );
}

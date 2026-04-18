"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MonitorSmartphone, 
  AlertOctagon, 
  ScrollText, 
  Bot, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Devices", href: "/devices", icon: MonitorSmartphone },
  { name: "Alerts", href: "/alerts", icon: AlertOctagon },
  { name: "Logs", href: "/logs", icon: ScrollText },
  { name: "AI Assistant", href: "/ai", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  // Assume a dummy token for now - in reality this comes from next-auth/Cookies
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { isConnected } = useWebSocket("ws://localhost:8080/api/v1/ws", token);

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen">
      <div className="h-16 flex items-center px-6 border-b border-border justify-between">
        <h1 className="font-bold text-lg tracking-wider text-primary">I.R.I.S</h1>
        <ThemeToggle />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <div className="relative flex h-3 w-3">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-3 w-3",
              isConnected ? "bg-green-500" : "bg-red-500"
            )}></span>
          </div>
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>
    </aside>
  );
}

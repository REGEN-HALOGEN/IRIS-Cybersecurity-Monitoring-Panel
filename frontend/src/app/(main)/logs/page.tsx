"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search } from "lucide-react";

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockLogs = [
    {
      id: "log-1",
      timestamp: new Date(Date.now() - 5000).toISOString(),
      level: "info",
      device_id: "device-1",
      message: "Agent checked in successfully",
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 15000).toISOString(),
      level: "warn",
      device_id: "device-1",
      message: "CPU usage spiking above 85% threshold",
    },
    {
      id: "log-3",
      timestamp: new Date(Date.now() - 35000).toISOString(),
      level: "error",
      device_id: "device-2",
      message: "Connection timeout while buffering offline payloads",
    },
    {
      id: "log-4",
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: "info",
      device_id: "device-3",
      message: "Configuration dynamically updated",
    },
  ];

  const getLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return <Badge variant="destructive">ERROR</Badge>;
      case "warn":
        return <Badge variant="default" className="bg-amber-500">WARN</Badge>;
      case "info":
        return <Badge variant="outline" className="text-blue-500 border-blue-500/20 bg-blue-500/10">INFO</Badge>;
      default:
        return <Badge variant="secondary">DEBUG</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">System Logs</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter logs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[100px]">Level</TableHead>
              <TableHead className="w-[150px]">Device ID</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-mono text-sm">
            {mockLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center font-sans">
                  No logs available.
                </TableCell>
              </TableRow>
            ) : (
              mockLogs
                .filter(log => 
                   log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   log.device_id.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell>{getLevelBadge(log.level)}</TableCell>
                  <TableCell>{log.device_id}</TableCell>
                  <TableCell className={log.level === 'error' ? 'text-destructive' : ''}>
                    {log.message}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

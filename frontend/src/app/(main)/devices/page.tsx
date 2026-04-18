"use client";

import { useDeviceStore } from "@/stores/useDeviceStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function DevicesPage() {
  const { telemetry } = useDeviceStore();
  const devices = Object.values(telemetry);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Devices</h2>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>CPU</TableHead>
              <TableHead>Memory</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No devices currently sending telemetry.
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => {
                // Determine if device hasn't sent data in 30+ seconds
                const lastSeenSeconds = (Date.now() - new Date(device.timestamp).getTime()) / 1000;
                const isOffline = lastSeenSeconds > 30;

                const cpuUsage = device.cpu_usage_percent.toFixed(1);
                const memoryUsage = ((device.memory_used_mb / device.memory_total_mb) * 100).toFixed(1);

                return (
                  <TableRow key={device.device_id}>
                    <TableCell className="font-mono font-medium text-xs">
                      {device.device_id}
                    </TableCell>
                    <TableCell>
                      {isOffline ? (
                        <Badge variant="destructive">Offline</Badge>
                      ) : (
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                          Online
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{cpuUsage}%</TableCell>
                    <TableCell>{memoryUsage}%</TableCell>
                    <TableCell>
                      {device.anomaly_flags?.length > 0 ? (
                        <Badge variant="destructive">
                          {device.anomaly_flags.length} Anomaly
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(device.timestamp), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

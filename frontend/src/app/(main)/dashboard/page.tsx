"use client";

import { useDeviceStore } from "@/stores/useDeviceStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ShieldAlert, Laptop, HardDrive, Cpu, Wifi, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { format, formatDistanceToNow, subMinutes, subHours, subDays, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { devices, telemetry, telemetryHistory, activityFeed } = useDeviceStore();
  const [timeRange, setTimeRange] = useState<"1m" | "5m" | "15m">("1m");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const totalDevices = devices?.length || 0;
  const onlineDevices = devices?.filter(d => d.status === "online").length || 0;
  const offlineDevices = totalDevices - onlineDevices;

  // Process historical data for chart based on timeRange
  const chartData = useMemo(() => {
    const tickMap: Record<string, any> = {};
    
    const cutoff = timeRange === "1m" ? subMinutes(now, 1) : timeRange === "5m" ? subMinutes(now, 5) : subMinutes(now, 15);

    Object.keys(telemetryHistory).forEach(deviceId => {
      const history = telemetryHistory[deviceId];
      history.forEach(point => {
        const time = new Date(point.timestamp);
        if (!isAfter(time, cutoff)) return;
        const timeKey = format(time, "HH:mm:ss");
        if (!tickMap[timeKey]) tickMap[timeKey] = { time: timeKey };
        tickMap[timeKey][deviceId] = point.cpu_usage_percent ?? 0;
      });
    });

    return Object.values(tickMap).sort((a, b) => a.time.localeCompare(b.time));
  }, [telemetryHistory, timeRange, now]);

  // Aggregate stats
  let totalCpuUsage = 0;
  let totalMemUsage = 0;
  let deviceCountWithTelemetry = 0;

  Object.values(telemetry).forEach((data: any) => {
    if (data.cpu_usage_percent !== undefined && data.memory_used_mb !== undefined && data.memory_total_mb !== undefined) {
      totalCpuUsage += data.cpu_usage_percent;
      totalMemUsage += (data.memory_used_mb / data.memory_total_mb) * 100;
      deviceCountWithTelemetry++;
    }
  });

  const avgCpuUsage = deviceCountWithTelemetry > 0 ? (totalCpuUsage / deviceCountWithTelemetry).toFixed(1) : 0;
  const avgMemUsage = deviceCountWithTelemetry > 0 ? (totalMemUsage / deviceCountWithTelemetry).toFixed(1) : 0;
  const criticalAlerts = activityFeed?.filter(a => a.severity === 'critical').length || 0;

  const currentCpuStr = avgCpuUsage;
  const peakCpu = chartData.reduce((max, tick) => {
     let curMax = 0;
     Object.keys(tick).filter(k => k !== 'time').forEach(k => {
         if (tick[k] > curMax) curMax = tick[k];
     });
     return curMax > max ? curMax : max;
  }, 0).toFixed(1);

  return (
    <div className="flex xl:flex-row flex-col h-full w-full gap-6">
      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">SOC Overview</h2>
            <p className="text-muted-foreground mt-1 text-sm">Real-time infrastructure security and telemetry tracking.</p>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Refresh Data</Button>
              <Button variant="outline" size="sm">View Devices</Button>
              <Button variant="default" size="sm">Trigger Scan</Button>
          </div>
        </div>

        {/* Top Cards Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Real Device insight panel */}
          <Card className="hover:-translate-y-1 hover:shadow-lg transition-all bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Status</CardTitle>
              <Laptop className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onlineDevices} Live</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${onlineDevices > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`}></span>
                {offlineDevices} delayed/offline
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:-translate-y-1 hover:shadow-lg transition-all bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Health</CardTitle>
              <Cpu className={`h-4 w-4 ${Number(avgCpuUsage) > 80 ? 'text-destructive' : 'text-emerald-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgCpuUsage}%</div>
            </CardContent>
          </Card>

          <Card className="hover:-translate-y-1 hover:shadow-lg transition-all bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Memory Health</CardTitle>
              <HardDrive className={`h-4 w-4 ${Number(avgMemUsage) > 90 ? 'text-destructive' : 'text-emerald-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgMemUsage}%</div>
            </CardContent>
          </Card>

          <Card className="hover:-translate-y-1 hover:shadow-lg transition-all bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
              <ShieldAlert className={`h-4 w-4 ${criticalAlerts > 0 ? 'text-destructive' : 'text-emerald-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${criticalAlerts > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                {criticalAlerts > 0 ? `${criticalAlerts} Critical` : 'Clear'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-muted/50">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Continuous Telemetry Analytics</CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-bold">{currentCpuStr}%</span>
                   <span className="text-muted-foreground text-sm font-semibold">Current</span>
                </div>
                <div className="flex items-baseline gap-1 opacity-70">
                   <span className="text-xl font-bold">{peakCpu}%</span>
                   <span className="text-muted-foreground text-xs font-semibold">Peak</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
               <div className="space-x-2 bg-muted p-1 rounded-md">
                 <Button variant={timeRange === "1m" ? "default" : "ghost"} size="sm" onClick={() => setTimeRange("1m")}>1m</Button>
                 <Button variant={timeRange === "5m" ? "default" : "ghost"} size="sm" onClick={() => setTimeRange("5m")}>5m</Button>
                 <Button variant={timeRange === "15m" ? "default" : "ghost"} size="sm" onClick={() => setTimeRange("15m")}>15m</Button>
               </div>
               <div className="text-xs text-muted-foreground animate-pulse flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Last updated just now
               </div>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                  {Object.keys(telemetryMapFilter(chartData)).map((deviceId, i) => (
                    <Area
                      key={deviceId}
                      type="monotone"
                      dataKey={deviceId}
                      stroke={`hsl(var(--chart-${(i % 5) + 1}))`}
                      fill={`hsl(var(--chart-${(i % 5) + 1}) / 0.2)`}
                      isAnimationActive={true}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side Feed Area */}
      <div className="w-full xl:w-96 flex flex-col space-y-4">
        <Card className="flex-1 flex flex-col h-[700px] bg-card/50 backdrop-blur-sm border-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Recent Activity Feed
            </CardTitle>
            <CardDescription>System incidents and agent events</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 pr-4">
            {!activityFeed || activityFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-24 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/50 mb-3" />
                <p className="text-sm font-medium text-emerald-500">No threats detected</p>
                <p className="text-xs text-muted-foreground mt-1">Infrastructure is operating normally.</p>
              </div>
            ) : (
              activityFeed.map((event) => (
                <div key={event.id} className="flex items-start gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0 animate-in slide-in-from-left-2 duration-300">
                  <div className="mt-0.5">
                    {event.severity === 'critical' ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : event.severity === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : event.severity === 'info' && event.type === 'connection' ? (
                       <Wifi className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm font-medium leading-none ${event.severity === 'critical' ? 'text-destructive' : 'text-foreground'}`}>
                      {event.type.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground break-words mt-1">{event.message}</p>
                    <p className="text-[10px] text-muted-foreground pt-1 opacity-70">
                       {event.timestamp ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) : "Unknown time"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function telemetryMapFilter(data: any[]) {
    const keys: Record<string, boolean> = {};
    data.forEach(d => {
        Object.keys(d).forEach(k => {
            if (k !== 'time') keys[k] = true;
        });
    });
    return keys;
}
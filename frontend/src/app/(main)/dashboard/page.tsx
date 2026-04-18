"use client";

import { useDeviceStore } from "@/stores/useDeviceStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Activity, ShieldAlert, Laptop, HardDrive, Cpu, Wifi, AlertTriangle, CheckCircle2, ChevronRight, X, PlayCircle, Eye, Shield, ActivitySquare, Server, Globe, CpuIcon, Flame } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { format, formatDistanceToNow, subMinutes, subHours, subDays, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Device, TelemetryData } from "@/types";

function SeverityBadge({ severity }: { severity: string }) {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive" className="bg-red-500/15 text-red-500 border-red-500/30">🔴 Critical</Badge>;
    case 'high':
      return <Badge variant="destructive" className="bg-orange-500/15 text-orange-500 border-orange-500/30">🟠 High</Badge>;
    case 'medium':
      return <Badge variant="outline" className="bg-yellow-500/15 text-yellow-500 border-yellow-500/30">🟡 Medium</Badge>;
    default:
      return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">🟢 Low</Badge>;
  }
}

function StatusBadge({ status }: { status: "online" | "offline" | "suspicious" }) {
  switch (status) {
    case "online":
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-normal"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />Live</Badge>;
    case "suspicious":
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-normal"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />Suspicious</Badge>;
    default:
      return <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border font-normal"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-2" />Offline</Badge>;
  }
}

function getSecurityScore(device: Device, telemetry: TelemetryData | undefined) {
  // Mock scoring logic for now
  if (device.status === 'offline') return 0;
  if (device.status === 'suspicious') return 45;
  if (telemetry && (telemetry.cpu_usage_percent > 90 || (telemetry.memory_used_mb / telemetry.memory_total_mb) > 0.9)) return 75;
  return 98;
}

export default function DashboardPage() {
  const { devices, telemetry, telemetryHistory, activityFeed, addActivity } = useDeviceStore();
  const [timeRange, setTimeRange] = useState<"1m" | "5m" | "15m">("1m");
  const [now, setNow] = useState(new Date());
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const totalDevices = devices?.length || 0;
  const onlineDevices = devices?.filter(d => d.status === "online").length || 0;
  
  // Real active alerts count (mocked from feed for now if alerts array not fully populated)
  const activeAlertsCount = activityFeed?.filter(a => a.severity === 'critical' || a.severity === 'error' || a.type === 'alert').length || 0;
  const criticalDevicesCount = devices?.filter(d => d.status === "suspicious" || getSecurityScore(d, telemetry[d.id]) < 50).length || 0;
  
  const avgResponseTime = "24ms"; // Simulated for now
  const overallSecurityScore = devices?.length > 0 
    ? Math.round(devices.reduce((acc, d) => acc + getSecurityScore(d, telemetry[d.id]), 0) / devices.length) 
    : 100;

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

  let totalCpuUsage = 0;
  let deviceCountWithTelemetry = 0;

  Object.values(telemetry).forEach((data: any) => {
    if (data.cpu_usage_percent !== undefined) {
      totalCpuUsage += data.cpu_usage_percent;
      deviceCountWithTelemetry++;
    }
  });

  const avgCpuUsageStr = deviceCountWithTelemetry > 0 ? (totalCpuUsage / deviceCountWithTelemetry).toFixed(1) : "0";

  const triggerScan = () => {
    addActivity({
      id: Math.random().toString(36).substr(2, 9),
      type: 'alert',
      message: 'Manual security scan initiated by user',
      timestamp: new Date().toISOString(),
      severity: 'info'
    });
  };

  return (
    <div className="flex xl:flex-row flex-col h-full w-full gap-6 relative">
      {/* Detail Overlay */}
      {selectedDevice && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl shadow-2xl border-border/50 bg-card">
            <CardHeader className="flex flex-row items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">{selectedDevice.name}</CardTitle>
                  <StatusBadge status={selectedDevice.status} />
                </div>
                <CardDescription className="font-mono mt-1 text-xs">{selectedDevice.id}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDevice(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">CPU Usage</p>
                  <p className="text-2xl font-bold">{telemetry[selectedDevice.id]?.cpu_usage_percent?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Memory Usage</p>
                  <p className="text-2xl font-bold">{telemetry[selectedDevice.id] ? Math.round((telemetry[selectedDevice.id].memory_used_mb / telemetry[selectedDevice.id].memory_total_mb) * 100) : 0}%</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Security Score</p>
                  <p className={`text-2xl font-bold ${getSecurityScore(selectedDevice, telemetry[selectedDevice.id]) < 50 ? 'text-destructive' : 'text-emerald-500'}`}>
                    {getSecurityScore(selectedDevice, telemetry[selectedDevice.id])}/100
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2"><ActivitySquare className="h-4 w-4" /> Top Processes</h4>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>PID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">CPU</TableHead>
                        <TableHead className="text-right">Memory</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {telemetry[selectedDevice.id]?.processes?.slice(0, 4).map(p => (
                        <TableRow key={p.pid}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{p.pid}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{p.cpu_percent.toFixed(1)}%</TableCell>
                          <TableCell className="text-right text-muted-foreground">{p.mem_mb} MB</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10">Kill</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!telemetry[selectedDevice.id]?.processes || telemetry[selectedDevice.id]?.processes.length === 0) && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No process data available</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t justify-between py-4">
              <Button variant="outline" onClick={() => setSelectedDevice(null)}>Close</Button>
              <Button variant="default">Generate Deep Analysis</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">System Status</h2>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2.5 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" /> Streaming Live
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">Real-time infrastructure security and telemetry tracking.</p>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/devices'}>View Devices</Button>
              <Button variant="default" size="sm" onClick={triggerScan} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">Trigger Scan</Button>
          </div>
        </div>

        {/* Top Metrics row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:-translate-y-1 hover:shadow-lg transition-all bg-card/50 backdrop-blur-sm group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className={`h-4 w-4 ${overallSecurityScore >= 90 ? 'text-emerald-500' : overallSecurityScore >= 60 ? 'text-amber-500' : 'text-destructive'} group-hover:scale-110 transition-transform`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-baseline gap-2">
                <span className={`${overallSecurityScore >= 90 ? 'text-emerald-500' : overallSecurityScore >= 60 ? 'text-amber-500' : 'text-destructive'}`}>
                  {overallSecurityScore}
                </span>
                <span className="text-sm text-muted-foreground font-normal">/ 100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Network-wide safety index</p>
            </CardContent>
          </Card>
          
          <Card className="hover:-translate-y-1 hover:shadow-lg transition-all bg-card/50 backdrop-blur-sm group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <ShieldAlert className={`h-4 w-4 ${activeAlertsCount > 0 ? 'text-orange-500' : 'text-muted-foreground'} group-hover:scale-110 transition-transform`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAlertsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Requiring direct attention</p>
            </CardContent>
          </Card>

          <Card className="hover:-translate-y-1 hover:shadow-lg transition-all bg-card/50 backdrop-blur-sm group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Devices</CardTitle>
              <Laptop className={`h-4 w-4 ${criticalDevicesCount > 0 ? 'text-destructive' : 'text-emerald-500'} group-hover:scale-110 transition-transform`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalDevicesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Displaying suspicious behavior</p>
            </CardContent>
          </Card>

          <Card className="hover:-translate-y-1 hover:shadow-lg transition-all bg-card/50 backdrop-blur-sm group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Activity className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResponseTime}</div>
              <p className="text-xs text-muted-foreground mt-1">Agent checking interval</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Main Chart */}
          <Card className="bg-card/50 backdrop-blur-sm border-muted/50 flex flex-col group">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2"><CpuIcon className="h-5 w-5" /> Network Compute Load</CardTitle>
                <div className="flex items-baseline gap-2 mt-2">
                   <span className="text-3xl font-bold">{avgCpuUsageStr}%</span>
                   <span className="text-muted-foreground text-sm font-medium">Average</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
                  <Button variant={timeRange === "1m" ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setTimeRange("1m")}>1m</Button>
                  <Button variant={timeRange === "5m" ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setTimeRange("5m")}>5m</Button>
                  <Button variant={timeRange === "15m" ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setTimeRange("15m")}>15m</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[220px] pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    {Object.keys(chartData[0] || {}).filter(k => k !== 'time').map((deviceId, i) => (
                      <linearGradient key={deviceId} id={`color${deviceId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={`hsl(var(--chart-${(i % 5) + 1}))`} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={`hsl(var(--chart-${(i % 5) + 1}))`} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  {Object.keys(chartData[0] || {}).filter(k => k !== 'time').map((deviceId, i) => (
                    <Area
                      key={deviceId}
                      type="monotone"
                      dataKey={deviceId}
                      stroke={`hsl(var(--chart-${(i % 5) + 1}))`}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#color${deviceId})`}
                      isAnimationActive={true}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Table Snippet */}
          <Card className="bg-card/50 backdrop-blur-sm border-muted/50 flex flex-col overflow-hidden !p-0 !gap-0">
            <CardHeader className="pt-4 pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> Monitored Devices</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => window.location.href = '/devices'}>View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="pl-4">Hostname</TableHead>
                    <TableHead>IP / OS</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices?.slice(0, 5).map(device => (
                    <TableRow 
                      key={device.id} 
                      className="cursor-pointer hover:bg-muted/30 group transition-colors"
                      onClick={() => setSelectedDevice(device)}
                    >
                      <TableCell className="pl-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" /> {device.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{device.ip_address || "192.168.1.?"}</div>
                        <div className="text-xs text-muted-foreground">{device.os_version || "Windows 11"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={`h-full ${getSecurityScore(device, telemetry[device.id]) > 80 ? 'bg-emerald-500' : getSecurityScore(device, telemetry[device.id]) > 50 ? 'bg-amber-500' : 'bg-destructive'}`} 
                              style={{ width: `${getSecurityScore(device, telemetry[device.id])}%` }} 
                            />
                          </div>
                          <span className="text-xs font-medium">{getSecurityScore(device, telemetry[device.id])}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <StatusBadge status={device.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!devices || devices.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Server className="h-8 w-8 mb-2 opacity-20" />
                          <p>No devices detected</p>
                          <p className="text-xs mt-1">Ensure your agent is running.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Side Feed Area - REAL ALERTS PANEL */}
      <div className="w-full xl:w-96 flex flex-col space-y-4">
        <Card className="flex-1 flex flex-col h-[750px] bg-card/40 backdrop-blur-md border-border shadow-sm overflow-hidden !p-0 !gap-0">
          <CardHeader className="bg-muted/10 border-b pt-4 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="h-5 w-5 text-orange-500" /> Live Alert Feed
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">{activeAlertsCount} pending</Badge>
            </div>
            <CardDescription className="text-xs">Security events requiring intervention</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-0">
            {!activityFeed || activityFeed.filter(a => a.type === 'alert').length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 fade-in animate-in">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-foreground">All systems secure</p>
                <p className="text-xs text-muted-foreground mt-1">No pending security alerts from agents.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {activityFeed.filter(a => a.type === 'alert').map((event) => (
                  <div key={event.id} className="p-4 hover:bg-muted/20 transition-colors group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <SeverityBadge severity={event.severity || 'low'} />
                      <p className="text-[10px] text-muted-foreground font-mono">
                         {event.timestamp ? format(new Date(event.timestamp), 'HH:mm:ss') : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight mb-1">{event.message}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5 mb-3 font-mono">
                        <Laptop className="h-3 w-3" />
                         {devices.find(d => d.id === event.device_id)?.name || event.device_id || "Unknown Source"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="sm" className="h-7 text-xs flex-1 bg-primary/10 text-primary hover:bg-primary/20"><Eye className="h-3 w-3 mr-1" /> Inspect</Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1"><Activity className="h-3 w-3 mr-1" /> Explain (AI)</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          
          {/* Logs Preview Snippet */}
          <CardFooter className="flex-col items-stretch border-t border-border/50 bg-muted/10 p-4 mt-auto">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Globe className="h-3 w-3" /> Recent System Logs</h4>
            <div className="space-y-2 font-mono text-[10px] text-muted-foreground">
              {activityFeed?.slice(0, 3).map(log => (
                <div key={log.id} className="truncate">
                  <span className="opacity-50">{format(new Date(log.timestamp || new Date()), 'HH:mm:ss')}</span> 
                  <span className="mx-1.5 opacity-30">|</span> 
                  <span className={log.severity === 'critical' ? 'text-destructive' : 'text-foreground'}>{log.message}</span>
                </div>
              ))}
              {(!activityFeed || activityFeed.length === 0) && <div className="text-center opacity-50 py-2">No incoming logs...</div>}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3 h-7 text-xs text-muted-foreground">View Full Logs <ChevronRight className="h-3 w-3 ml-1" /></Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


export interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline';
  last_seen: string | null;
  created_at: string;
}

export interface TelemetryData {
  device_id: string;
  timestamp: string;
  cpu_usage_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_used_gb: number;
  disk_total_gb: number;
  uptime_seconds: number;
  processes: {
    pid: number;
    name: string;
    cpu_percent: number;
    mem_mb: number;
  }[];
  anomaly_flags: string[];
}

export interface Alert {
  id: string;
  device_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  type: 'log' | 'alert' | 'connection';
  message: string;
  timestamp: string;
  device_id?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}


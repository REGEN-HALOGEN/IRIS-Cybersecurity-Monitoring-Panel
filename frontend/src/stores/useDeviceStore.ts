import { create } from 'zustand';
import { Device, TelemetryData, ActivityEvent, Alert } from '../types';

interface DeviceState {
  devices: Device[];
  telemetry: Record<string, TelemetryData>;
  telemetryHistory: Record<string, TelemetryData[]>;
  activityFeed: ActivityEvent[];
  alerts: Alert[];
  setDevices: (devices: Device[]) => void;
  updateDeviceStatus: (id: string, status: 'online' | 'offline' | 'suspicious') => void;
  addTelemetry: (data: TelemetryData) => void;
  addActivity: (event: ActivityEvent) => void;
  getDeviceTelemetry: (id: string) => TelemetryData | undefined;
}

const MAX_HISTORY_LEN = 100;

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  telemetry: {},
  telemetryHistory: {},
  activityFeed: [],
  alerts: [],
  setDevices: (devices) => set({ devices }),
  updateDeviceStatus: (id, status) => set((state) => {
    // Also add to activity feed
    const device = state.devices.find(d => d.id === id) || { name: 'Unknown' };
    const newActivity: ActivityEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'connection',
      message: `Device ${device.name} is now ${status}`,
      timestamp: new Date().toISOString(),
      device_id: id,
      severity: status === 'online' ? 'info' : 'warning',
    };

    return {
      devices: state.devices.map(d => d.id === id ? { ...d, status, last_seen: new Date().toISOString() } : d),
      activityFeed: [newActivity, ...state.activityFeed].slice(0, 50),
    };
  }),
  addTelemetry: (data) => set((state) => {
    const history = state.telemetryHistory[data.device_id] || [];
    const newHistory = [...history, data];
    if (newHistory.length > MAX_HISTORY_LEN) {
      newHistory.shift(); // remove oldest
    }
    
    // Check for alerts to add to activity feed
    let newFeed = [...state.activityFeed];
    if (data.anomaly_flags && data.anomaly_flags.length > 0) {
      data.anomaly_flags.forEach(flag => {
        newFeed.unshift({
          id: Math.random().toString(36).substr(2, 9),
          type: 'alert',
          message: `Anomaly detected: ${flag}`,
          timestamp: data.timestamp,
          device_id: data.device_id,
          severity: 'critical'
        });
      });
      newFeed = newFeed.slice(0, 50);
    }

    return {
      telemetry: { ...state.telemetry, [data.device_id]: data },
      telemetryHistory: { ...state.telemetryHistory, [data.device_id]: newHistory },
      activityFeed: newFeed
    };
  }),
  addActivity: (event) => set((state) => ({
    activityFeed: [event, ...state.activityFeed].slice(0, 50)
  })),
  getDeviceTelemetry: (id) => get().telemetry[id],
}));

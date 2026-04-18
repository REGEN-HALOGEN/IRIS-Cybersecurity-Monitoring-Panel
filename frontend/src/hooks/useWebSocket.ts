import { useEffect, useRef, useState } from 'react';
import { useDeviceStore } from '../stores/useDeviceStore';

export function useWebSocket(url: string, token: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  
  // Zustand store actions
  const addTelemetry = useDeviceStore((state) => state.addTelemetry);
  const updateDeviceStatus = useDeviceStore((state) => state.updateDeviceStatus);

  useEffect(() => {
    if (!token) return;

    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      // Append token as query param since standard WS doesn't support custom headers in browser
      ws.current = new WebSocket(`${url}`);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log('WS connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.TelemetryUpdate) {
            addTelemetry(data.TelemetryUpdate);
          } else if (data.DeviceStatusChanged) {
            updateDeviceStatus(
              data.DeviceStatusChanged.device_id, 
              data.DeviceStatusChanged.status
            );
          } else if (data.AlertCreated) {
            // handle alert
            console.log('New alert', data.AlertCreated);
          }
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, token, addTelemetry, updateDeviceStatus]);

  return { isConnected };
}

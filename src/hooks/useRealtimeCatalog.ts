import { useEffect, useRef, useState, useCallback } from 'react';

export interface RealtimeNotification {
  id: string;
  message: string;
  timestamp: string;
}

export function useRealtimeCatalog(onCatalogChange: () => void) {
  const [notification, setNotification] = useState<RealtimeNotification | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.event === 'catalog:changed' || payload.event === 'song:published') {
            // Trigger automatic catalog refresh without page reload
            onCatalogChange();

            // Display live toast notification
            if (payload.data?.message) {
              setNotification({
                id: 'notif_' + Date.now(),
                message: payload.data.message,
                timestamp: payload.timestamp || new Date().toISOString()
              });

              // Auto-dismiss after 4 seconds
              setTimeout(() => {
                setNotification((curr) => (curr?.id.startsWith('notif_') ? null : curr));
              }, 4000);
            }
          }
        } catch (err) {
          console.warn('Realtime event parse notice:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.warn('WebSocket connection attempt failed:', err);
      reconnectTimeoutRef.current = setTimeout(() => connect(), 4000);
    }
  }, [onCatalogChange]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const dismissNotification = () => setNotification(null);

  return { isConnected, notification, dismissNotification };
}

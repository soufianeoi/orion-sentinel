import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { OSINTEvent } from '../types';

export function useWebSocket(onEvent: (event: OSINTEvent) => void) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    });

    socket.on('osint-event', (event: OSINTEvent) => {
      onEvent(event);
    });

    socket.on('metrics-update', (metrics) => {
      // Could integrate with metrics state
      console.log('Metrics update:', metrics);
    });

    return () => {
      socket.disconnect();
    };
  }, [onEvent]);

  return { connected, socket: socketRef.current };
}

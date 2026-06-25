// Shim for Realtime Service

import { useEffect, useState } from "react";

export interface RealtimeMessage {
  type: string;
  data: any;
  timestamp?: number;
}

export const useRealtime = (channel?: string, options?: any) => {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [presence, setPresence] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate connection
    setIsConnected(true);
    setPresence([]);
    return () => {
      setIsConnected(false);
    };
  }, []);

  const sendUpdate = (message: RealtimeMessage | any) => {
    // Stub implementation
  };

  return {
    data,
    isConnected,
    presence,
    error,
    sendUpdate,
    send: sendUpdate,
  };
};

export class RealtimeService {
  static async connect(channel: string): Promise<any> {
    return {};
  }

  static async disconnect(): Promise<void> {
    return;
  }

  static async subscribe(channel: string, callback: (msg: RealtimeMessage) => void): Promise<void> {
    return;
  }

  static async publish(channel: string, message: RealtimeMessage): Promise<void> {
    return;
  }
}

export default RealtimeService;

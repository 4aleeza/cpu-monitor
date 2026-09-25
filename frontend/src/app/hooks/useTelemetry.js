"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
const MAX_SAMPLES = 30;

export default function useTelemetry() {
  const [connected, setConnected] = useState(false);
  const [cpuStatic, setCpuStatic] = useState(null);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    const handleCpuStatic = (data) => {
      if (data && typeof data === "object") {
        setCpuStatic(data);
      }
    };

    const handleMetrics = (data) => {
      if (!data || typeof data !== "object") return;

      setLatest(data);

      setHistory((previous) => {
        const overallLoad = Number(data?.cpu?.overallLoad);
        const averageGHz = data?.cpu?.clockSpeed?.averageGHz;

        const sample = {
          timestamp: data.timestamp ?? Date.now(),
          overallLoad: Number.isFinite(overallLoad) ? overallLoad : null,
          averageGHz: averageGHz == null || !Number.isFinite(Number(averageGHz)) ? null : Number(averageGHz),
        };

        const next = [...previous, sample];
        return next.length > MAX_SAMPLES ? next.slice(next.length - MAX_SAMPLES) : next;
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("cpu_static", handleCpuStatic);
    socket.on("metrics_update", handleMetrics);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("cpu_static", handleCpuStatic);
      socket.off("metrics_update", handleMetrics);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { connected, cpuStatic, latest, history };
}

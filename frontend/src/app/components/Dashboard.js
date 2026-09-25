"use client";

import useTelemetry from "../hooks/useTelemetry";
import CpuGauge from "./CpuGauge";
import CpuUsageChart from "./CpuUsageChart";
import ClockSpeedChart from "./ClockSpeedChart";
import LogicalProcessorChart from "./LogicalProcessorChart";
import ProcessList from "./ProcessList";
import StaticCpuInfo from "./StaticCpuInfo";

function formatTimestamp(ts) {
  if (!ts) return null;
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour12: false });
}

export default function Dashboard() {
  const { connected, cpuStatic, latest, history } = useTelemetry();

  const cpu = latest?.cpu ?? null;
  const lastUpdate = formatTimestamp(latest?.timestamp);

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 text-neutral-200 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-900 pb-5">
          <div>
            <h1 className="text-lg font-semibold text-neutral-50">CPU Monitoring</h1>
            <p className="mt-1 text-xs text-neutral-500">
              {cpuStatic?.brand ? cpuStatic.brand : "Loading CPU information…"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span className="text-xs tabular-nums text-neutral-500">Updated {lastUpdate}</span>
            )}
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                connected
                  ? "border-emerald-900 bg-emerald-950/50 text-emerald-400"
                  : "border-red-900 bg-red-950/40 text-red-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-500"}`}
              />
              {connected ? "Live" : "Disconnected"}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <CpuGauge overallLoad={cpu?.overallLoad} hasData={Boolean(cpu)} />
          <CpuUsageChart history={history} />
          <ClockSpeedChart history={history} />
        </div>

        <div className="mt-4">
          <LogicalProcessorChart coreLoads={cpu?.coreLoads} clockCores={cpu?.clockSpeed?.cores} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ProcessList processes={latest?.topProcesses} />
          <StaticCpuInfo cpuStatic={cpuStatic} />
        </div>
      </div>
    </main>
  );
}

"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function clamp(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(100, Math.max(0, numericValue));
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200">
      <div className="font-medium">{item.label}</div>
      <div className="tabular-nums text-neutral-400">Load: {item.load.toFixed(1)}%</div>
      {item.speedGHz !== null && (
        <div className="tabular-nums text-neutral-400">Clock: {item.speedGHz.toFixed(2)} GHz</div>
      )}
    </div>
  );
}

function LogicalProcessorChart({ coreLoads, clockCores }) {
  const loads = Array.isArray(coreLoads) ? coreLoads : [];
  const speeds = Array.isArray(clockCores) ? clockCores : [];

  const data = loads.map((entry, index) => {
    const coreIndex = typeof entry?.core === "number" ? entry.core : index;
    const match = speeds.find((speed) => speed && speed.core === coreIndex) ?? speeds[index] ?? null;
    const speed = match && Number.isFinite(Number(match.speedGHz)) ? Number(match.speedGHz) : null;

    return {
      key: coreIndex,
      label: `CPU ${coreIndex + 1}`,
      load: clamp(entry?.load),
      speedGHz: speed,
    };
  });

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 transition-colors hover:border-neutral-700">
      <header className="mb-4">
        <h2 className="text-sm font-medium text-neutral-200">Logical Processor Usage</h2>
        <p className="text-xs text-neutral-500">
          {data.length ? `${data.length} logical processors` : "Per-processor utilization"}
        </p>
      </header>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
          Waiting for telemetry…
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip cursor={{ fill: "#ffffff08" }} content={<CustomTooltip />} />
              <Bar dataKey="load" fill="#818cf8" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default memo(LogicalProcessorChart);

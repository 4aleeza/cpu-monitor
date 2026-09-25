"use client";

import { memo } from "react";

function clamp(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(100, Math.max(0, numericValue));
}

function CpuGauge({ overallLoad, hasData }) {
  const value = clamp(overallLoad);
  const radius = 88;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 transition-colors hover:border-neutral-700">
      <header className="mb-4">
        <h2 className="text-sm font-medium text-neutral-200">Current CPU Load</h2>
        <p className="text-xs text-neutral-500">Overall utilization across all logical processors</p>
      </header>

      {!hasData ? (
        <div className="flex h-56 items-center justify-center text-sm text-neutral-500">
          Waiting for telemetry…
        </div>
      ) : (
        <div className="relative flex h-56 items-center justify-center">
          <svg viewBox="0 0 220 220" className="h-56 w-56 -rotate-90">
            <circle cx="110" cy="110" r={radius} fill="none" stroke="#262626" strokeWidth={stroke} />
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="#34d399"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-widest text-neutral-500">CPU Usage</span>
            <span className="mt-1 text-4xl font-semibold tabular-nums text-neutral-50">
              {value.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(CpuGauge);

"use client";

import { memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatTime(ts) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour12: false });
}

function ClockSpeedChart({ history }) {
  const allSamples = Array.isArray(history) ? history : [];
  const data = allSamples.filter(
    (sample) => typeof sample.averageGHz === "number" && Number.isFinite(sample.averageGHz),
  );
  const current = data.length ? data[data.length - 1].averageGHz : null;

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 transition-colors hover:border-neutral-700">
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-medium text-neutral-200">Clock Speed History</h2>
          <p className="text-xs text-neutral-500">Average across logical processors</p>
        </div>
        <span className="text-2xl font-semibold tabular-nums text-neutral-50">
          {current === null ? "--" : `${current.toFixed(2)} GHz`}
        </span>
      </header>

      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-neutral-500">
          {allSamples.length === 0 ? "Waiting for telemetry…" : "Clock speed unavailable"}
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="clockFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) => Number(v).toFixed(1)}
              />
              <Tooltip
                contentStyle={{
                  background: "#0a0a0a",
                  border: "1px solid #262626",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={formatTime}
                formatter={(value) => [`${Number(value).toFixed(2)} GHz`, "Avg clock"]}
              />
              <Area
                type="monotone"
                dataKey="averageGHz"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#clockFill)"
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default memo(ClockSpeedChart);

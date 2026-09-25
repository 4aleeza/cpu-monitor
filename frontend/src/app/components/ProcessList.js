"use client";

import { memo } from "react";

function ProcessList({ processes }) {
  const rows = Array.isArray(processes) ? processes : [];

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 transition-colors hover:border-neutral-700">
      <header className="mb-4">
        <h2 className="text-sm font-medium text-neutral-200">Top Processes</h2>
        <p className="text-xs text-neutral-500">Reported by the backend, ranked by CPU</p>
      </header>

      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-neutral-500">No process data available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="pb-2 font-medium">Process</th>
                <th className="pb-2 font-medium">PID</th>
                <th className="pb-2 text-right font-medium">CPU %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((process) => (
                <tr
                  key={process?.pid}
                  className="border-t border-neutral-900 text-neutral-300 transition-colors hover:bg-neutral-900/60"
                >
                  <td className="py-2 pr-4">{process?.name ?? "Unknown"}</td>
                  <td className="py-2 pr-4 tabular-nums text-neutral-500">{process?.pid ?? "--"}</td>
                  <td className="py-2 text-right tabular-nums">
                    {Number.isFinite(Number(process?.cpu)) ? Number(process.cpu).toFixed(1) : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default memo(ProcessList);

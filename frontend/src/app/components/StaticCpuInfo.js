"use client";

import { memo } from "react";

function InfoItem({ label, value }) {
  return (
    <div className="min-w-[140px]">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 text-sm text-neutral-200">{value ?? "--"}</div>
    </div>
  );
}

function StaticCpuInfo({ cpuStatic }) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 transition-colors hover:border-neutral-700">
      <header className="mb-4">
        <h2 className="text-sm font-medium text-neutral-200">CPU Information</h2>
      </header>

      {!cpuStatic ? (
        <div className="py-4 text-sm text-neutral-500">Loading CPU information…</div>
      ) : (
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <InfoItem label="Manufacturer" value={cpuStatic.manufacturer} />
          <InfoItem label="Model" value={cpuStatic.brand} />
          <InfoItem label="Physical Cores" value={cpuStatic.physicalCores} />
          <InfoItem label="Logical Processors" value={cpuStatic.logicalCores} />
          <InfoItem
            label="Base Clock"
            value={
              Number.isFinite(Number(cpuStatic.baseSpeedGHz))
                ? `${Number(cpuStatic.baseSpeedGHz).toFixed(2)} GHz`
                : null
            }
          />
          <InfoItem
            label="Reported Max Clock"
            value={
              Number.isFinite(Number(cpuStatic.maxSpeedGHz))
                ? `${Number(cpuStatic.maxSpeedGHz).toFixed(2)} GHz`
                : null
            }
          />
        </div>
      )}
    </section>
  );
}

export default memo(StaticCpuInfo);

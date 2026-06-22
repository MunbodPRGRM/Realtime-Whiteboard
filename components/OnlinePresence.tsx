"use client";

import { useOthers, useSelf, useStatus } from "@liveblocks/react";

const COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function Avatar({
  name,
  color,
  title,
}: {
  name: string;
  color: string;
  title: string;
}) {
  return (
    <div
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-medium text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function OnlinePresence() {
  const others = useOthers();
  const self = useSelf();
  const status = useStatus();
  const total = others.length + (self ? 1 : 0);

  if (status !== "connected") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        กำลังเชื่อมต่อ…
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {self && (
          <Avatar
            name={self.info?.name ?? "ฉัน"}
            color="#111827"
            title={`${self.info?.name ?? "ฉัน"} (คุณ)`}
          />
        )}
        {others.slice(0, 4).map(({ connectionId, info }) => (
          <Avatar
            key={connectionId}
            name={info?.name ?? "ผู้ใช้"}
            color={COLORS[connectionId % COLORS.length]}
            title={info?.name ?? "ผู้ใช้"}
          />
        ))}
        {others.length > 4 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-400 text-xs font-medium text-white">
            +{others.length - 4}
          </div>
        )}
      </div>
      <span className="text-xs text-gray-500">{total} คนออนไลน์</span>
    </div>
  );
}

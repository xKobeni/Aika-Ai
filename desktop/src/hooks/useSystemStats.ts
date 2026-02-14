import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface SystemStats {
  cpu: number;
  ramUsedMb: number;
  ramTotalMb: number;
  ramPercent: number;
  gpu: number | null;
}

const isTauri =
  typeof window !== 'undefined' &&
  !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;

export function useSystemStats(intervalMs = 1500): SystemStats | null {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    if (!isTauri) {
      if (typeof performance !== 'undefined' && (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory) {
        const mem = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
        setStats({
          cpu: 0,
          ramUsedMb: Math.round(mem.usedJSHeapSize / 1024 / 1024),
          ramTotalMb: Math.round(mem.totalJSHeapSize / 1024 / 1024),
          ramPercent: mem.totalJSHeapSize > 0 ? (mem.usedJSHeapSize / mem.totalJSHeapSize) * 100 : 0,
          gpu: null,
        });
      }
      return;
    }

    let cancelled = false;
    const fetchStats = async () => {
      if (cancelled) return;
      try {
        const raw = await invoke<{ cpu: number; ram_used_mb: number; ram_total_mb: number; ram_percent: number; gpu: number | null }>('get_system_stats');
        if (!cancelled) {
          setStats({
            cpu: raw.cpu,
            ramUsedMb: raw.ram_used_mb,
            ramTotalMb: raw.ram_total_mb,
            ramPercent: raw.ram_percent,
            gpu: raw.gpu ?? null,
          });
        }
      } catch {
        if (!cancelled) setStats(null);
      }
    };

    fetchStats();
    const id = setInterval(fetchStats, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return stats;
}

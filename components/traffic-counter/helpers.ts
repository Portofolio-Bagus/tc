import { VehicleCategory, SubVehicle, DirectionCount } from './types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTimeRange(startSeconds: number, intervalMinutes: number): string {
  const intervalSeconds = intervalMinutes * 60;
  const intervalStart = startSeconds;
  const intervalEnd = startSeconds + intervalSeconds;
  return `${formatTime(intervalStart)}–${formatTime(intervalEnd)}`;
}

export function getCurrentIntervalIndex(elapsedSeconds: number, intervalMinutes: number): number {
  return Math.floor(elapsedSeconds / (intervalMinutes * 60));
}

export function getIntervalElapsed(elapsedSeconds: number, intervalMinutes: number): number {
  return elapsedSeconds % (intervalMinutes * 60);
}

export function getIntervalTimeLabel(startTime: string, intervalIndex: number, intervalMinutes: number): string {
  const start = new Date(startTime);
  const intervalMs = intervalMinutes * 60 * 1000;
  const intervalStart = new Date(start.getTime() + intervalIndex * intervalMs);
  const intervalEnd = new Date(start.getTime() + (intervalIndex + 1) * intervalMs);
  const format = (d: Date) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}.${m}`;
  };
  return `${format(intervalStart)}-${format(intervalEnd)}`;
}

export function formatDateIndonesian(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  if (isNaN(date.getTime())) return dateStr;
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function getAllVehicles(categories: VehicleCategory[]): SubVehicle[] {
  if (!categories || !Array.isArray(categories)) return [];
  const result: SubVehicle[] = [];
  for (const c of categories) {
    if (c?.vehicles && Array.isArray(c.vehicles) && c.vehicles.length > 0) {
      result.push(...c.vehicles);
    } else if (c?.id && c?.name) {
      result.push({ id: c.id, name: c.name, short: c.short || '', icon: c.icon || '' });
    }
  }
  return result;
}

export function getCatTotal(intervalData: any, vehicleId: string, surveyType: 'ruas' | 'simpang'): number {
  if (!intervalData) return 0;
  if (surveyType === 'simpang') {
    const count = intervalData[vehicleId] as DirectionCount || { left: 0, straight: 0, right: 0 };
    return count.left + count.straight + count.right;
  }
  return (intervalData[vehicleId] as number) || 0;
}

export function cloneCategories(categories: VehicleCategory[]): VehicleCategory[] {
  if (!categories || !Array.isArray(categories)) return [];
  return categories.map((c) => ({ ...c, vehicles: (c.vehicles || []).map((v) => ({ ...v })) }));
}
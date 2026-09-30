export interface ServerStorageStats {
  totalLimitBytes: number;
  totalLimitFormatted: string;
  usedBytes: number;
  usedFormatted: string;
  freeBytes: number;
  freeFormatted: string;
  usagePercent: number;
  mediaCount: number;
  uploadFilesCount: number;
  roomsCount: number;
}

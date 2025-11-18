// src/utils/dateHelpers.ts
export const toLocalISODate = (d: Date | string | number): string => {
    const date = (d instanceof Date) ? d : new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`; // YYYY-MM-DD (local)
  };
  
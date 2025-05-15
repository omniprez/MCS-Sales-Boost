import { format } from 'date-fns';

// Port Louis, Mauritius time zone (UTC+4)
export const MAURITIUS_TIMEZONE = 'Indian/Mauritius';

/**
 * Gets the current date and time in Mauritius time zone (UTC+4)
 */
export function getCurrentTime(): Date {
  // Create a new date object (in UTC)
  const now = new Date();
  
  // Adjust for Mauritius time zone (UTC+4)
  // First get the UTC time by adding the local timezone offset
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  
  // Then add the Mauritius timezone offset (UTC+4 = +240 minutes)
  const mauritiusTime = new Date(utcTime + (4 * 60 * 60 * 1000));
  
  return mauritiusTime;
}

/**
 * Formats a date for display
 */
export function formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Formats a date and time for display
 */
export function formatDateTime(date: Date | string, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  return formatDate(date, formatStr);
}

/**
 * Determines the financial year for a given date
 * Financial year runs from July to June (e.g., FY 2024-2025 is July 2024 to June 2025)
 */
export function getFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  
  const fyStartYear = month >= 7 ? year : year - 1;
  return `${fyStartYear}-${fyStartYear + 1}`;
}

/**
 * Gets the current financial year
 */
export function getCurrentFinancialYear(): string {
  return getFinancialYear(getCurrentTime());
}

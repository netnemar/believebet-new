import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединяет className-строки с поддержкой Tailwind Merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Cache-busting version for static assets
export const ASSET_VERSION = Date.now().toString();

// Function to get asset URL with version
export function getAssetUrl(path: string): string {
  // Add version as query parameter to bypass cache
  return `${path}?v=${ASSET_VERSION}`;
}

// TODO: добавить другие хелперы (рандомизация, генерация аватаров) по мере необходимости. 
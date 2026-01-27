import { CarportConfig } from '@/types/carport';

const CONFIG_URL_PARAM = 'config';

/**
 * Encode config to base64 for URL sharing
 */
export function encodeConfig(config: CarportConfig): string {
  try {
    const json = JSON.stringify(config);
    // Use encodeURIComponent to handle unicode characters
    const base64 = btoa(encodeURIComponent(json));
    return base64;
  } catch (error) {
    console.error('Failed to encode config:', error);
    return '';
  }
}

/**
 * Decode config from base64 URL param
 */
export function decodeConfig(encoded: string): CarportConfig | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const config = JSON.parse(json) as CarportConfig;
    
    // Basic validation - check required fields exist
    if (
      typeof config.width !== 'number' ||
      typeof config.depth !== 'number' ||
      typeof config.height !== 'number' ||
      typeof config.color !== 'string' ||
      typeof config.roofType !== 'string'
    ) {
      console.error('Invalid config structure');
      return null;
    }
    
    return config;
  } catch (error) {
    console.error('Failed to decode config:', error);
    return null;
  }
}

/**
 * Generate shareable URL with config
 */
export function generateShareUrl(config: CarportConfig): string {
  const encoded = encodeConfig(config);
  if (!encoded) return window.location.origin + window.location.pathname;
  
  const url = new URL(window.location.href);
  url.searchParams.set(CONFIG_URL_PARAM, encoded);
  return url.toString();
}

/**
 * Parse config from current URL
 */
export function parseConfigFromUrl(): CarportConfig | null {
  if (typeof window === 'undefined') return null;
  
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get(CONFIG_URL_PARAM);
  
  if (!encoded) return null;
  
  return decodeConfig(encoded);
}

/**
 * Remove config param from URL (after loading)
 */
export function clearConfigFromUrl(): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  url.searchParams.delete(CONFIG_URL_PARAM);
  window.history.replaceState({}, '', url.toString());
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const result = document.execCommand('copy');
    document.body.removeChild(textArea);
    return result;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

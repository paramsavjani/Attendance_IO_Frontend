import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a hex color to HSL format for use with CSS hsl() function
 * @param hex - Hex color string (e.g., "#3B82F6" or "3B82F6")
 * @returns HSL string in format "h s% l%" (e.g., "234 89% 64%")
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number, l: number;

  l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
      default:
        h = 0;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

/**
 * Lightens a dark HSL color to make it more visible in the UI
 * Preserves the hue, adjusts saturation slightly, and increases lightness
 * @param hsl - HSL string in format "h s% l%" (e.g., "234 89% 64%")
 * @param minLightness - Minimum lightness percentage (default: 60%)
 * @returns Lightened HSL string
 */
export function lightenHsl(hsl: string, minLightness: number = 60): string {
  // Parse HSL string: "h s% l%"
  const parts = hsl.trim().split(/\s+/);
  if (parts.length !== 3) {
    return hsl; // Return original if format is invalid
  }

  const h = parseInt(parts[0]);
  let s = parseInt(parts[1].replace('%', ''));
  let l = parseInt(parts[2].replace('%', ''));

  // If lightness is too dark, lighten it significantly
  if (l < minLightness) {
    // Fully lighten to minimum, or even higher for very dark colors
    const targetLightness = l < 30 ? minLightness + 10 : minLightness;
    l = targetLightness;
    
    // Slightly reduce saturation for very dark colors to make them more vibrant when lightened
    // This prevents overly saturated colors that can look garish
    if (l < 40) {
      s = Math.max(70, s * 0.9); // Reduce saturation by 10% but keep at least 70%
    }
  }

  return `${h} ${Math.round(s)}% ${Math.round(l)}%`;
}

/**
 * Converts hex to HSL and automatically lightens dark colors for better UI visibility
 * @param hex - Hex color string (e.g., "#3B82F6" or "3B82F6")
 * @param minLightness - Minimum lightness percentage (default: 60%)
 * @returns Lightened HSL string in format "h s% l%"
 */
export function hexToHslLightened(hex: string, minLightness: number = 60): string {
  const hsl = hexToHsl(hex);
  return lightenHsl(hsl, minLightness);
}

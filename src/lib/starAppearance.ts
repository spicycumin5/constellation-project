/**
 * Converts a star's B-V color index into an approximate blackbody
 * temperature, then into an sRGB color. Based on the well-known
 * Ballesteros (2012) formula and Tanner Helland's blackbody-to-RGB
 * approximation.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function bvToKelvin(bv: number): number {
  const t = clamp(bv, -0.4, 2.0);
  return 4600 * (1 / (0.92 * t + 1.7) + 1 / (0.92 * t + 0.62));
}

export function kelvinToRgb(kelvin: number): [number, number, number] {
  const temp = clamp(kelvin, 1000, 40000) / 100;

  let r: number;
  let g: number;
  let b: number;

  if (temp <= 66) {
    r = 255;
  } else {
    r = clamp(329.698727446 * Math.pow(temp - 60, -0.1332047592), 0, 255);
  }

  if (temp <= 66) {
    g = clamp(99.4708025861 * Math.log(temp) - 161.1195681661, 0, 255);
  } else {
    g = clamp(288.1221695283 * Math.pow(temp - 60, -0.0755148492), 0, 255);
  }

  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = clamp(138.5177312231 * Math.log(temp - 10) - 305.0447927307, 0, 255);
  }

  return [r / 255, g / 255, b / 255];
}

/** Returns a normalized [r, g, b] color (0-1) for a star, given its B-V index. */
export function starColor(ci: number | null): [number, number, number] {
  const bv = ci ?? 0.65; // default to a Sun-like G star
  return kelvinToRgb(bvToKelvin(bv));
}

/**
 * Maps apparent magnitude to a render size (in world units). Brighter stars
 * (lower/negative magnitude) render larger; the dimmest visible stars (~6.5)
 * render as small points.
 */
export function magnitudeToSize(mag: number): number {
  const clamped = clamp(mag, -1.5, 6.5);
  return (2.6 - clamped * 0.32) * 1.6;
}

/** Maps apparent magnitude to a render opacity (0-1). */
export function magnitudeToOpacity(mag: number): number {
  const clamped = clamp(mag, -1.5, 6.5);
  return clamp(1.15 - clamped * 0.13, 0.25, 1);
}

import * as Astronomy from "astronomy-engine";
import type { HorizontalPosition, PlanetPosition } from "@/types/sky";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function makeObserver(latitude: number, longitude: number, heightM = 0): Astronomy.Observer {
  return new Astronomy.Observer(latitude, longitude, heightM);
}

/** Local Apparent Sidereal Time, in degrees [0, 360). */
export function localSiderealTimeDeg(date: Date, longitude: number): number {
  const gstHours = Astronomy.SiderealTime(date);
  const lstHours = ((gstHours + longitude / 15) % 24 + 24) % 24;
  return lstHours * 15;
}

/**
 * Converts equatorial coordinates (RA/Dec, in degrees) to horizontal
 * coordinates (altitude/azimuth, in degrees) using plane spherical
 * trigonometry. Fast enough to call for thousands of stars per frame.
 */
export function equatorialToHorizontal(
  raDeg: number,
  decDeg: number,
  latDeg: number,
  lstDeg: number
): HorizontalPosition {
  const dec = decDeg * DEG2RAD;
  const lat = latDeg * DEG2RAD;
  const hourAngle = (lstDeg - raDeg) * DEG2RAD;

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(hourAngle);
  const altitude = Math.asin(clamp(sinAlt, -1, 1));

  const cosLatCosAlt = Math.cos(lat) * Math.cos(altitude);
  let azimuth: number;
  if (Math.abs(cosLatCosAlt) < 1e-9) {
    // Observer at a pole or object at zenith/nadir: azimuth is undefined, default to 0.
    azimuth = 0;
  } else {
    const cosAz = clamp((Math.sin(dec) - Math.sin(altitude) * Math.sin(lat)) / cosLatCosAlt, -1, 1);
    azimuth = Math.acos(cosAz);
    if (Math.sin(hourAngle) > 0) {
      azimuth = 2 * Math.PI - azimuth;
    }
  }

  return {
    altitude: altitude * RAD2DEG,
    azimuth: azimuth * RAD2DEG,
  };
}

const PLANET_BODIES: { name: string; body: Astronomy.Body }[] = [
  { name: "Sun", body: Astronomy.Body.Sun },
  { name: "Moon", body: Astronomy.Body.Moon },
  { name: "Mercury", body: Astronomy.Body.Mercury },
  { name: "Venus", body: Astronomy.Body.Venus },
  { name: "Mars", body: Astronomy.Body.Mars },
  { name: "Jupiter", body: Astronomy.Body.Jupiter },
  { name: "Saturn", body: Astronomy.Body.Saturn },
  { name: "Uranus", body: Astronomy.Body.Uranus },
  { name: "Neptune", body: Astronomy.Body.Neptune },
];

/** Computes alt/az and magnitude for the Sun, Moon, and visible planets. */
export function getPlanetPositions(date: Date, observer: Astronomy.Observer): PlanetPosition[] {
  return PLANET_BODIES.map(({ name, body }) => {
    const equ = Astronomy.Equator(body, date, observer, true, true);
    const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");
    const illum = Astronomy.Illumination(body, date);
    return {
      name,
      ra: equ.ra * 15,
      dec: equ.dec,
      altitude: hor.altitude,
      azimuth: hor.azimuth,
      magnitude: illum.mag,
    };
  });
}

/**
 * Converts horizontal coordinates to a point on a unit sphere for rendering.
 * Y is up (zenith). Azimuth 0 (North) maps to -Z, azimuth 90 (East) maps to +X.
 */
export function horizontalToCartesian(altitude: number, azimuth: number, radius = 1): [number, number, number] {
  const alt = altitude * DEG2RAD;
  const az = azimuth * DEG2RAD;
  const cosAlt = Math.cos(alt);
  const x = radius * cosAlt * Math.sin(az);
  const y = radius * Math.sin(alt);
  const z = -radius * cosAlt * Math.cos(az);
  return [x, y, z];
}

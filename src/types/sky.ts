export interface StarRecord {
  id: number;
  hip: number | null;
  name: string | null;
  bayer: string | null;
  flam: string | null;
  con: string | null;
  ra: number; // degrees, 0-360 (J2000)
  dec: number; // degrees, -90..90 (J2000)
  mag: number; // apparent magnitude
  ci: number | null; // B-V color index
  dist: number | null; // parsecs
  spect: string | null;
}

export interface ConstellationRecord {
  id: string; // IAU 3-letter abbreviation
  name: string; // English name
  lines: number[][][]; // MultiLineString coordinates: [ [ [ra_deg, dec_deg], ... ], ... ]
}

export interface HorizontalPosition {
  altitude: number; // degrees above horizon
  azimuth: number; // degrees, 0 = North, 90 = East
}

export interface PlanetPosition extends HorizontalPosition {
  name: string;
  ra: number; // degrees
  dec: number; // degrees
  magnitude: number;
}

export interface SkyQuery {
  date: Date; // UTC instant
  latitude: number; // degrees north
  longitude: number; // degrees east
}

export type HoverTarget =
  | { kind: "star"; star: StarRecord }
  | { kind: "planet"; planet: PlanetPosition };

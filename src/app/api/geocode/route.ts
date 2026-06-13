import { NextRequest, NextResponse } from "next/server";

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/** Geocodes a place name to coordinates via OpenStreetMap's Nominatim API. */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ results: [] satisfies GeocodeResult[] });
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Spaces-NightSkyApp/1.0",
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
  }

  const data = (await response.json()) as NominatimResult[];
  const results: GeocodeResult[] = data.map((item) => ({
    name: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
  }));

  return NextResponse.json({ results });
}

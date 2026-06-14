export interface Bookmark {
  id: string;
  label: string;
  description: string;
  date: string; // ISO 8601, UTC
  latitude: number;
  longitude: number;
}

export const bookmarks: Bookmark[] = [
  {
    id: "birthplace",
    label: "Kyumin's birthplace",
    description: "Mesa, AZ — Mar 30, 2004, 3:04 PM",
    date: "2004-03-30T22:04:00.000Z",
    latitude: 33.4152,
    longitude: -111.8315,
  },
  {
    id: "confession",
    label: "Where Kyumin confessed to his girlfriend",
    description: "Mulholland Scenic Parkway and Corridor, Los Angeles, CA — 11:05 PM",
    date: "2024-01-01T07:05:00.000Z",
    latitude: 34.1281,
    longitude: -118.3486,
  },
];

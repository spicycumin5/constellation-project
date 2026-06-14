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
    id: "apply", 
    label: "Kyumin applies to an early career role at Astronomer",
    description: "121 Cypress St, Pacifica, CA — June 15, 2026, 7:00 AM",
    date: "2026-06-15T14:00:00.000Z",
    latitude: 37.6138,
    longitude: -122.4869,
  },
  {
    id: "confession",
    label: "Kyumin confesses to Aimee",
    description: "Mulholland Scenic Parkway and Corridor, Los Angeles, CA — May 27, 2026, 11:05 PM",
    date: "2026-05-28T06:05:00.000Z",
    latitude: 34.1281,
    longitude: -118.3486,
  },
  {
    id: "major",
    label: "Kyumin declares fast food as his major",
    description: "Pepperdine University, Malibu, CA — Feb 13, 2023, 3:04 PM",
    date: "2023-02-13T23:04:00.000Z",
    latitude: 34.0259,
    longitude: -118.7798
  },
  {
    id: "birthplace",
    label: "Kyumin's birthplace",
    description: "Mesa, AZ — Mar 30, 2004, 3:04 PM",
    date: "2004-03-30T22:04:00.000Z",
    latitude: 33.4152,
    longitude: -111.8315,
  },
];

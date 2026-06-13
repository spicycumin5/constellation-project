// One-off data-processing script: converts the raw HYG star catalog CSV and
// d3-celestial constellation data into compact JSON files for the app.
// Run with: node scripts/build-data.mjs
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const tmp = join(root, "tmp");
const outDir = join(root, "public", "data");
mkdirSync(outDir, { recursive: true });

// --- Minimal CSV parser that handles quoted fields ---
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// --- Process stars ---
console.log("Reading HYG star catalog...");
const csvText = readFileSync(join(tmp, "hygdata_v41.csv"), "utf-8");
const rows = parseCsv(csvText);
const header = rows[0];
const col = Object.fromEntries(header.map((name, i) => [name, i]));

const MAG_LIMIT = 6.5; // naked-eye visibility limit

const stars = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length < header.length) continue;
  const mag = parseFloat(r[col.mag]);
  if (!Number.isFinite(mag) || mag > MAG_LIMIT) continue;

  const raHours = parseFloat(r[col.ra]);
  const dec = parseFloat(r[col.dec]);
  if (!Number.isFinite(raHours) || !Number.isFinite(dec)) continue;

  const id = parseInt(r[col.id], 10);
  const hip = r[col.hip] ? parseInt(r[col.hip], 10) : null;
  const proper = r[col.proper] || null;
  const bayer = r[col.bayer] || null;
  const flam = r[col.flam] || null;
  const con = r[col.con] || null;
  const ci = r[col.ci] ? parseFloat(r[col.ci]) : null;
  const dist = r[col.dist] ? parseFloat(r[col.dist]) : null;
  const spect = r[col.spect] || null;

  stars.push({
    id,
    hip,
    name: proper,
    bayer,
    flam,
    con,
    ra: raHours * 15, // degrees, 0-360
    dec, // degrees, -90..90
    mag,
    ci,
    dist,
    spect,
  });
}

stars.sort((a, b) => a.mag - b.mag);
console.log(`Filtered to ${stars.length} stars (mag <= ${MAG_LIMIT})`);
writeFileSync(join(outDir, "stars.json"), JSON.stringify(stars));

// --- Process constellation lines + names ---
console.log("Reading constellation data...");
const linesGeo = JSON.parse(readFileSync(join(tmp, "constellations.lines.json"), "utf-8"));
const namesGeo = JSON.parse(readFileSync(join(tmp, "constellations.json"), "utf-8"));

const namesById = {};
for (const f of namesGeo.features) {
  namesById[f.id] = f.properties.en || f.properties.name || f.id;
}

const constellations = linesGeo.features.map((f) => ({
  id: f.id,
  name: namesById[f.id] || f.id,
  // GeoJSON coords are [RA_deg, Dec_deg]; keep as-is for consistency with stars.
  lines: f.geometry.coordinates,
}));

console.log(`Processed ${constellations.length} constellations`);
writeFileSync(join(outDir, "constellations.json"), JSON.stringify(constellations));

console.log("Done.");

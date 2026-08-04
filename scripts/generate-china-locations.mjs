import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pinyin } from "pinyin-pro";

const mapDirectory = process.argv[2] ?? resolve("node_modules/china-map-echarts/map");
const records = new Map();
for (const file of await readdir(mapDirectory)) {
  if (!/^\d{6}\.json$/.test(file)) continue;
  const geojson = JSON.parse(await readFile(resolve(mapDirectory, file), "utf8"));
  for (const feature of geojson.features ?? []) {
    const properties = feature.properties ?? {};
    const code = String(properties.adcode ?? "");
    const coordinate = properties.center ?? properties.centroid;
    if (!/^\d{6}$/.test(code) || !Array.isArray(coordinate) || records.has(code)) continue;
    const name = String(properties.name ?? "").trim();
    if (!name) continue;
    records.set(code, {
      code,
      name,
      parentCode: String(properties.parent?.adcode ?? "100000"),
      level: properties.level === "province" ? "province" : properties.level === "city" ? "city" : "district",
      longitude: Number(Number(coordinate[0]).toFixed(6)),
      latitude: Number(Number(coordinate[1]).toFixed(6)),
      pinyin: pinyin(name, { toneType: "none", type: "array" }).join("").toLowerCase(),
      initials: pinyin(name, { pattern: "first", toneType: "none", type: "array" }).join("").toLowerCase(),
    });
  }
}
const rows = [...records.values()].sort((left, right) => left.code.localeCompare(right.code));
await writeFile(resolve("lib/china-locations.ts"), `// Generated from china-map-echarts 1.0.5 (ISC). Coordinates are administrative center points.\nexport type ChinaLocation = { code:string; name:string; parentCode:string; level:"province"|"city"|"district"; longitude:number; latitude:number; pinyin:string; initials:string };\nexport const CHINA_LOCATIONS: readonly ChinaLocation[] = ${JSON.stringify(rows)} as const;\n`);
console.log(`Generated ${rows.length} administrative locations.`);

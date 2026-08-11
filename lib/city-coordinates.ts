export type CityCoordinate = { name: string; aliases: string[]; latitude: number; longitude: number; timeZone: string };

export const CITY_COORDINATES: CityCoordinate[] = [
  { name: "北京", aliases: ["北京市", "beijing"], latitude: 39.9042, longitude: 116.4074, timeZone: "Asia/Shanghai" },
  { name: "上海", aliases: ["上海市", "shanghai"], latitude: 31.2304, longitude: 121.4737, timeZone: "Asia/Shanghai" },
  { name: "杭州", aliases: ["杭州市", "hangzhou"], latitude: 30.2741, longitude: 120.1551, timeZone: "Asia/Shanghai" },
  { name: "广州", aliases: ["广州市", "guangzhou"], latitude: 23.1291, longitude: 113.2644, timeZone: "Asia/Shanghai" },
  { name: "深圳", aliases: ["深圳市", "shenzhen"], latitude: 22.5431, longitude: 114.0579, timeZone: "Asia/Shanghai" },
  { name: "成都", aliases: ["成都市", "chengdu"], latitude: 30.5728, longitude: 104.0668, timeZone: "Asia/Shanghai" },
  { name: "重庆", aliases: ["重庆市", "chongqing"], latitude: 29.563, longitude: 106.5516, timeZone: "Asia/Shanghai" },
  { name: "南京", aliases: ["南京市", "nanjing"], latitude: 32.0603, longitude: 118.7969, timeZone: "Asia/Shanghai" },
  { name: "武汉", aliases: ["武汉市", "wuhan"], latitude: 30.5928, longitude: 114.3055, timeZone: "Asia/Shanghai" },
  { name: "西安", aliases: ["西安市", "xi'an", "xian"], latitude: 34.3416, longitude: 108.9398, timeZone: "Asia/Shanghai" },
  { name: "台北", aliases: ["台北市", "taipei"], latitude: 25.033, longitude: 121.5654, timeZone: "Asia/Taipei" },
  { name: "香港", aliases: ["hong kong", "hongkong"], latitude: 22.3193, longitude: 114.1694, timeZone: "Asia/Hong_Kong" },
  { name: "新加坡", aliases: ["singapore"], latitude: 1.3521, longitude: 103.8198, timeZone: "Asia/Singapore" },
  { name: "纽约", aliases: ["new york", "new york city", "nyc"], latitude: 40.7128, longitude: -74.006, timeZone: "America/New_York" },
  { name: "洛杉矶", aliases: ["los angeles", "la"], latitude: 34.0522, longitude: -118.2437, timeZone: "America/Los_Angeles" },
  { name: "伦敦", aliases: ["london"], latitude: 51.5074, longitude: -0.1278, timeZone: "Europe/London" },
  { name: "巴黎", aliases: ["paris"], latitude: 48.8566, longitude: 2.3522, timeZone: "Europe/Paris" },
  { name: "东京", aliases: ["tokyo"], latitude: 35.6762, longitude: 139.6503, timeZone: "Asia/Tokyo" },
  { name: "悉尼", aliases: ["sydney"], latitude: -33.8688, longitude: 151.2093, timeZone: "Australia/Sydney" },
];

export function resolveCityCoordinate(value: string) {
  const normalized = value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  if (!normalized) return null;
  return CITY_COORDINATES.find((city) => [city.name, ...city.aliases].some((alias) => alias.toLocaleLowerCase() === normalized)) ?? null;
}

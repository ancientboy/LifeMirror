export type BirthDateParts = { year: number; month: number; day: number };
export type BirthDatePart = keyof BirthDateParts;

const pad = (value: number) => String(value).padStart(2, "0");

export function parseBirthDate(value: string): BirthDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match
    ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
    : { year: 0, month: 0, day: 0 };
}

export function updateBirthDatePart(current: BirthDateParts, part: BirthDatePart, value: number) {
  const parts = { ...current, [part]: value };
  if (parts.year && parts.month && parts.day) {
    parts.day = Math.min(parts.day, new Date(parts.year, parts.month, 0).getDate());
    return { parts, value: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}` };
  }
  return { parts, value: null };
}

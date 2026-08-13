"use client";

import { useId, useMemo } from "react";
import styles from "./BirthDateFields.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  minYear?: number;
  maxYear?: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

function partsOf(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : { year: 0, month: 0, day: 0 };
}

export function BirthDateFields({ value, onChange, name, required = false, minYear = 1900, maxYear = new Date().getFullYear() }: Props) {
  const id = useId();
  const { year, month, day } = partsOf(value);
  const years = useMemo(() => Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index), [maxYear, minYear]);
  const days = useMemo(() => {
    const safeYear = year || 2000;
    const safeMonth = month || 1;
    return Array.from({ length: new Date(safeYear, safeMonth, 0).getDate() }, (_, index) => index + 1);
  }, [year, month]);
  const update = (next: Partial<{ year: number; month: number; day: number }>) => {
    const nextYear = next.year ?? year;
    const nextMonth = next.month ?? month;
    let nextDay = next.day ?? day;
    if (!nextYear || !nextMonth || !nextDay) { onChange(""); return; }
    nextDay = Math.min(nextDay, new Date(nextYear, nextMonth, 0).getDate());
    onChange(`${nextYear}-${pad(nextMonth)}-${pad(nextDay)}`);
  };
  return <div className={styles.dateFields}>
    {name && <input type="hidden" name={name} value={value} />}
    <label className={styles.field} htmlFor={`${id}-year`}><span>出生年份 <small className={styles.yearHint}>下拉可直接定位年份</small></span><select id={`${id}-year`} value={year || ""} required={required} onChange={(event) => update({ year: Number(event.target.value) })}><option value="" disabled>选择年份</option>{years.map((item) => <option value={item} key={item}>{item} 年</option>)}</select></label>
    <label className={styles.field} htmlFor={`${id}-month`}><span>月</span><select id={`${id}-month`} value={month || ""} required={required} onChange={(event) => update({ month: Number(event.target.value) })}><option value="" disabled>选择</option>{Array.from({ length: 12 }, (_, index) => index + 1).map((item) => <option value={item} key={item}>{item} 月</option>)}</select></label>
    <label className={styles.field} htmlFor={`${id}-day`}><span>日</span><select id={`${id}-day`} value={day || ""} required={required} onChange={(event) => update({ day: Number(event.target.value) })}><option value="" disabled>选择</option>{days.map((item) => <option value={item} key={item}>{item} 日</option>)}</select></label>
  </div>;
}

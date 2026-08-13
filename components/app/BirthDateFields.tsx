"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { parseBirthDate, updateBirthDatePart, type BirthDatePart } from "../../lib/birth-date-selection";
import styles from "./BirthDateFields.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  minYear?: number;
  maxYear?: number;
};

export function BirthDateFields({ value, onChange, name, required = false, minYear = 1900, maxYear = new Date().getFullYear() }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(() => parseBirthDate(value));
  const { year, month, day } = draft;
  useEffect(() => setDraft(parseBirthDate(value)), [value]);
  const years = useMemo(() => Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index), [maxYear, minYear]);
  const days = useMemo(() => {
    const safeYear = year || 2000;
    const safeMonth = month || 1;
    return Array.from({ length: new Date(safeYear, safeMonth, 0).getDate() }, (_, index) => index + 1);
  }, [year, month]);
  const update = (part: BirthDatePart, nextValue: number) => {
    const next = updateBirthDatePart(draft, part, nextValue);
    setDraft(next.parts);
    if (next.value) onChange(next.value);
  };
  return <div className={styles.dateFields}>
    {name && <input type="hidden" name={name} value={value} />}
    <label className={styles.field} htmlFor={`${id}-year`}><span>出生年份 <small className={styles.yearHint}>下拉可直接定位年份</small></span><select id={`${id}-year`} value={year || ""} required={required} onChange={(event) => update("year", Number(event.target.value))}><option value="" disabled>选择年份</option>{years.map((item) => <option value={item} key={item}>{item} 年</option>)}</select></label>
    <label className={styles.field} htmlFor={`${id}-month`}><span>月</span><select id={`${id}-month`} value={month || ""} required={required} onChange={(event) => update("month", Number(event.target.value))}><option value="" disabled>选择</option>{Array.from({ length: 12 }, (_, index) => index + 1).map((item) => <option value={item} key={item}>{item} 月</option>)}</select></label>
    <label className={styles.field} htmlFor={`${id}-day`}><span>日</span><select id={`${id}-day`} value={day || ""} required={required} onChange={(event) => update("day", Number(event.target.value))}><option value="" disabled>选择</option>{days.map((item) => <option value={item} key={item}>{item} 日</option>)}</select></label>
  </div>;
}

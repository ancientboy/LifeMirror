"use client";

import { MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { CHINA_LOCATIONS, type ChinaLocation } from "../../lib/china-locations";
import styles from "./BirthProfileForm.module.css";

const provinces = CHINA_LOCATIONS.filter((item) => item.level === "province");
const cities = CHINA_LOCATIONS.filter((item) => item.level === "city");
const districts = CHINA_LOCATIONS.filter((item) => item.level === "district");

function matches(item: ChinaLocation, query: string) {
  const value = query.trim().toLowerCase().replace(/\s+/g, "");
  return !value || item.name.includes(query.trim()) || item.pinyin.includes(value) || item.initials.startsWith(value);
}

function displayName(item: ChinaLocation) {
  const city = item.level === "district" ? cities.find((candidate) => candidate.code === item.parentCode) : item.level === "city" ? item : null;
  const provinceCode = item.level === "province" ? item.code : city?.parentCode ?? item.parentCode;
  const province = provinces.find((candidate) => candidate.code === provinceCode);
  return [province?.name, city && city.name !== province?.name ? city.name : null, item.level === "district" ? item.name : null].filter(Boolean).join(" · ") || item.name;
}

export function LocationPicker({ onSelect }: { onSelect: (location: ChinaLocation, displayName: string) => void }) {
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [query, setQuery] = useState("");
  const province = provinces.find((item) => item.code === provinceCode);
  const provinceCities = useMemo(() => cities.filter((item) => item.parentCode === provinceCode), [provinceCode]);
  const directDistricts = useMemo(() => districts.filter((item) => item.parentCode === provinceCode), [provinceCode]);
  const cityDistricts = useMemo(() => districts.filter((item) => item.parentCode === cityCode), [cityCode]);
  const currentDistricts = provinceCities.length ? cityDistricts : directDistricts;
  const searchResults = useMemo(() => query.trim() ? CHINA_LOCATIONS.filter((item) => item.level !== "province" && matches(item, query)).slice(0, 24) : [], [query]);

  function selectLocation(item: ChinaLocation) {
    onSelect(item, displayName(item));
    setQuery("");
    if (item.level === "city") {
      setProvinceCode(item.parentCode); setCityCode(item.code); setDistrictCode("");
    } else if (item.level === "district") {
      const parentCity = cities.find((candidate) => candidate.code === item.parentCode);
      setProvinceCode(parentCity?.parentCode ?? item.parentCode); setCityCode(parentCity?.code ?? ""); setDistrictCode(item.code);
    }
  }

  return <div className={styles.regionPicker}>
    <div className={styles.regionPickerTitle}><MapPin /><span><b>中国大陆出生地</b><small>覆盖省、市与区县中心坐标；可按中文、完整拼音或首字母搜索。</small></span></div>
    <label className={styles.regionSearch}><MagnifyingGlass /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索：西湖 / xihu / xh" /></label>
    {searchResults.length > 0 && <div className={styles.regionResults}>{searchResults.map((item) => <button type="button" key={item.code} onClick={() => selectLocation(item)}><b>{item.name}</b><small>{displayName(item)} · {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</small></button>)}</div>}
    <div className={styles.regionGrid}>
      <label><span>省份</span><select value={provinceCode} onChange={(event) => { const code = event.target.value; setProvinceCode(code); setCityCode(""); setDistrictCode(""); const selected = provinces.find((item) => item.code === code); if (selected) onSelect(selected, selected.name); }}><option value="">请选择省份</option>{provinces.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label>
      <label><span>城市</span><select value={cityCode} disabled={!provinceCode || !provinceCities.length} onChange={(event) => { const item = cities.find((candidate) => candidate.code === event.target.value); setCityCode(event.target.value); setDistrictCode(""); if (item) selectLocation(item); }}><option value="">{provinceCities.length ? "请选择城市" : province ? "直辖市 / 特别行政区" : "请先选择省份"}</option>{provinceCities.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label>
      <label><span>区 / 县</span><select value={districtCode} disabled={!provinceCode || (provinceCities.length > 0 && !cityCode)} onChange={(event) => { const item = districts.find((candidate) => candidate.code === event.target.value); setDistrictCode(event.target.value); if (item) selectLocation(item); }}><option value="">可选，建议精确到区县</option>{currentDistricts.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label>
    </div>
    <p className={styles.locationPrecision}>命盘通常至少精确到市；启用真太阳时时建议精确到区县行政中心。只有校正后接近时辰边界，才需要进一步核对镇街或具体出生地址。</p>
  </div>;
}

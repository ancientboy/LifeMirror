declare module "lunar-javascript" {
  export interface SolarValue {
    getLunar(): LunarValue;
    toYmdHms(): string;
  }

  export interface JieQiValue {
    getName(): string;
    getSolar(): SolarValue;
  }

  export interface LunarValue {
    getEightChar(): EightCharValue;
    getPrevJie(wholeDay?: boolean): JieQiValue;
    getNextJie(wholeDay?: boolean): JieQiValue;
  }

  export interface EightCharValue {
    setSect(sect: 1 | 2): void;
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearGan(): string;
    getMonthGan(): string;
    getDayGan(): string;
    getTimeGan(): string;
    getYearZhi(): string;
    getMonthZhi(): string;
    getDayZhi(): string;
    getTimeZhi(): string;
    getYearHideGan(): string[];
    getMonthHideGan(): string[];
    getDayHideGan(): string[];
    getTimeHideGan(): string[];
    getYearWuXing(): string;
    getMonthWuXing(): string;
    getDayWuXing(): string;
    getTimeWuXing(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearShiShenGan(): string;
    getMonthShiShenGan(): string;
    getDayShiShenGan(): string;
    getTimeShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getMonthShiShenZhi(): string[];
    getDayShiShenZhi(): string[];
    getTimeShiShenZhi(): string[];
  }

  export const Solar: {
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): SolarValue;
  };
}

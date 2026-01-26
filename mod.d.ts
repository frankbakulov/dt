type mydate = Date | string | number;

interface Locale {
  weekdays: {
    shorthand: string[];
    longhand: string[];
  };
  months: {
    shorthand: (string | null)[];
    longhand: (string | null)[];
    parental: (string | null)[];
  };
  rangeSeparator: string;
}

interface DTType {
  nd(): Date;
  locale: Locale;
  WorkingWeekdays: number[];
  NonWorkingDates: any[];
  ruUnits: Record<string, string>;
  WorkingSatSun: any[];
  D_STD: string;
  T_STD: string;
  D_SQL: string;
  T_SQL: string;
  readonly DT_STD: string;
  readonly DT_SQL: string;
  is(d: mydate): boolean;
  getFormatFromDate(input_dt: mydate): string;
  add(input_dt: mydate, add: number, unit: string, format?: string): string;
  isWorkingDay(input_dt: mydate): boolean;
  addWorkingDays(add: number, input_dt?: mydate, format?: any): mydate;
  diffD(dt1: mydate, dt0: mydate): number;
  diffM(dt1: mydate, dt0: mydate): number;
  diffSec(dt1: mydate, dt0: mydate): number;
  fromNow(input_dt: mydate): string;
  addRoundMonths(input_dt: mydate, add: number): string;
  getMonthDays(Ym: string): number;
  format(input_dt: mydate | number, format?: string): string | number;
  now(format?: string): string | number;
  readonly curdate: string;
  isLeapYear(input_dt: mydate): boolean;
}

export declare const DT: DTType;
import { MK } from "../constants/project";

const toD = (s) => (s ? new Date(`${s}T00:00:00`) : null);
const toS = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");
const td = () => toS(new Date());
const addD = (s, n) => {
  const d = toD(s);
  d.setDate(d.getDate() + n);
  return toS(d);
};
const fmtD = (s) => {
  if (!s) return "—";
  const d = toD(s);
  return `${d.getDate()}. ${MK[d.getMonth()]} ${d.getFullYear()}`;
};
const fmtDs = (s) => {
  if (!s) return "";
  const d = toD(s);
  return `${d.getDate()} ${MK[d.getMonth()]}`;
};
const isWe = (s) => {
  if (!s) return false;
  const d = toD(s).getDay();
  return d === 0 || d === 6;
};
const weDays = (s, e) => {
  if (!s || !e) return 0;
  let c = s;
  let n = 0;
  while (c <= e) {
    if (isWe(c)) n++;
    c = addD(c, 1);
  }
  return n;
};
const getWeekNum = (s) => {
  const d = toD(s);
  const t = new Date(d.valueOf());
  t.setDate(t.getDate() + 3 - (t.getDay() + 6) % 7);
  const w = new Date(t.getFullYear(), 0, 4);
  return 1 + Math.round(((t.getTime() - w.getTime()) / 86400000 - 3 + (w.getDay() + 6) % 7) / 7);
};
const getWeeks = (days) => {
  const weeks = [];
  let cur = null;
  days.forEach((day) => {
    const wn = getWeekNum(day);
    const d = toD(day);
    const mo = MK[d.getMonth()];
    if (!cur || cur.num !== wn) {
      cur = { num: wn, month: mo, days: [day] };
      weeks.push(cur);
    } else {
      cur.days.push(day);
    }
  });
  return weeks;
};

export { toD, toS, td, addD, fmtD, fmtDs, isWe, weDays, getWeekNum, getWeeks };

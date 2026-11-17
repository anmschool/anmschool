import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLang, trackName, type Lang } from "../i18n";
import { Footer, Head, todayIso, useContent, useMe, useSeason } from "../ui";
import { forTrack } from "./shared";
import { IndexLayout } from "./IndexLayout";

type Item = { date: string; start: string; end?: string; title: string; note?: string; place?: string };
/** 홍보물 시간표와 같은 세 표. 청지기는 세 표 모두 해당 */
const TABLES = [
  { id: "t-youth", key: "대학청년·일반" },
  { id: "t-teen", key: "미래세대" },
  { id: "t-kids", key: "어린이" },
];
const WD: Record<Lang, string[]> = { ko: ["일", "월", "화", "수", "목", "금", "토"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], zh: ["日", "一", "二", "三", "四", "五", "六"] };
const NOW: Record<Lang, string> = { ko: "지금", en: "Now", zh: "现在" };
const TIME: Record<Lang, string> = { ko: "시간", en: "Time", zh: "时间" };
const quiet = (t: string) => /식사|휴식|취침|개인 기도|귀가|breakfast|lunch|dinner|meal|rest|break|sleep|bed|personal prayer|home|早餐|午餐|晚餐|休息|就寝|祷告|回家/i.test(t);
const m = (t: string) => { const [h, mm] = t.split(":").map(Number); return (h < 5 ? h + 24 : h) * 60 + mm; };
const dayLabel = (d: string, lang: Lang) => {
  const [y, mo, dd] = d.split("-").map(Number), w = WD[lang][new Date(y, mo - 1, dd).getDay()];
  return lang === "ko" ? `${mo}월 ${dd}일(${w})` : lang === "zh" ? `${mo}月${dd}日(${w})` : `${mo}/${dd} (${w})`;
};
/** 지금 시각(한국)을 분으로. 새벽 0~5시는 전날 밤으로 */
const nowKst = () => {
  const t = new Date(Date.now() + 9 * 3600e3), hm = t.toISOString().slice(11, 16);
  if (Number(hm.slice(0, 2)) < 5) t.setUTCDate(t.getUTCDate() - 1);   // 0~5시는 전날 표의 '취침' 칸
  return { date: t.toISOString().slice(0, 10), min: m(hm) };
};

type Cell = { text: string; note?: string; rs: number; cs: number; quiet: boolean; a: number; b: number };
/** 행 = 끝 시각이 있는 일정의 경계. 끝이 없는 일정(귀가·모임)은 시작이 든 행에. 같은 일정은 가로·세로로, 빈 칸은 세로로 합친다 */
function build(items: Item[]) {
  const days = Array.from(new Set(items.map(x => x.date))).sort();
  const bs = Array.from(new Set(items.filter(x => x.end).flatMap(x => [x.start, x.end!]))).sort((a, b) => m(a) - m(b));
  const rows = bs.map((s, i) => [s, bs[i + 1] ?? bs[0]] as const);
  const at = (d: string, a: number, b: number) =>
    items.find(x => x.date === d && m(x.start) >= a && m(x.start) < b) ?? items.find(x => x.date === d && x.end && m(x.start) < a && m(x.end) > a);
  const g = rows.map(([s, e]) => { const a = m(s), b = e === bs[0] ? m(e) + 1440 : m(e); return days.map(d => at(d, a, b)); });
  const span = rows.map(([s, e]) => [m(s), e === bs[0] ? m(e) + 1440 : m(e)] as const);
  const cover = g.map(r => r.map(() => false));
  const body: (Cell | null)[][] = g.map((r, ri) => {
    const out: (Cell | null)[] = [];
    for (let i = 0; i < r.length;) {
      if (cover[ri][i]) { out.push(null); i++; continue; }
      const x = r[i];
      let j = i; while (x && j + 1 < r.length && r[j + 1]?.title === x.title && !cover[ri][j + 1]) j++;
      let e = ri;
      if (j === i) while (e + 1 < g.length && (g[e + 1][i]?.title ?? "") === (x?.title ?? "") && (!x || g[e + 1][i] === x)) { e++; cover[e][i] = true; }
      out.push({ text: x?.title ?? "", note: x?.note, rs: e - ri + 1, cs: j - i + 1, quiet: !x || quiet(x.title), a: x ? m(x.start) : 0, b: x?.end ? m(x.end) : x ? m(x.start) + 1 : 0 });
      for (let k = i + 1; k <= j; k++) out.push(null);
      i = j + 1;
    }
    return out;
  });
  return { days, rows, span, body };
}

export default function Schedule() {
  const { content } = useContent();
  const s = useSeason();
  const { me } = useMe(s?.id);
  const { t, lang } = useLang();
  const [qs] = useSearchParams();
  const mine = qs.get("track") || me?.track?.replace(/^온라인\s*/, "");
  const [now, setNow] = useState(nowKst);
  useEffect(() => { const id = setInterval(() => setNow(nowKst()), 30e3); return () => clearInterval(id); }, []);

  const all = (content?.schedule ?? []).filter(x => x.project === s?.id) as (Item & { track: string })[];
  const tables = TABLES.map(tb => ({ ...tb, ...build(all.filter(x => forTrack(x.track, tb.key))) })).filter(tb => tb.days.length);
  const isMine = (k: string) => !!mine && trackName(mine, "ko") === trackName(k, "ko");
  // 행사 기간이면 오늘 표로, 아니면 내 트랙 표로 처음 이동
  const first = tables.find(tb => tb.days.includes(now.date) && (isMine(tb.key) || !mine)) ?? tables.find(tb => isMine(tb.key));
  const [pick, setPick] = useState<string>();
  const sel = tables.find(tb => tb.id === pick) ?? first ?? tables[0];

  return (
    <div className="app">
      <Head label="Schedule" title={t("schedule")} />
      <main className="body guide-body">
        {tables.length === 0 ? <div className="empty">{t("noSchedule")}</div> : (
          <IndexLayout items={tables.map(tb => ({ id: tb.id, title: trackName(tb.key, lang) }))} select={sel?.id} onSelect={setPick}>
            {tables.filter(tb => tb === sel).map(tb => {
              const ti = tb.days.indexOf(now.date);
              const cur = now.min;
              const rowNow = ti < 0 ? -1 : tb.span.findIndex(([a, b]) => cur >= a && cur < b);
              return (
                <section key={tb.id} id={tb.id} className="pl-sec tt-sec">
                  <h2>{trackName(tb.key, lang)}{isMine(tb.key) && <span className="mine">My</span>}</h2>
                  <p className="sub">{dayLabel(tb.days[0], lang)} – {dayLabel(tb.days[tb.days.length - 1], lang)}</p>
                  <p className="tt-note">{t("stewardTT")}</p>
                  <div className="tt-wrap">
                    <table className="tt">
                      <thead><tr><th className="tm">{TIME[lang]}</th>{tb.days.map((d, i) => <th key={d} className={i === ti ? "today" : ""}>{dayLabel(d, lang)}</th>)}</tr></thead>
                      <tbody>
                        {tb.rows.map(([a, b], ri) => {
                          const next = tb.body[ri + 1];
                          const strongOf = (c: Cell, ci: number) => { const below = tb.body[ri + c.rs]?.[ci]; return !next || !below || below.text !== c.text; };
                          const rowStrong = tb.body[ri].some((c, ci) => c && c.rs === 1 && strongOf(c, ci)) || !next;
                          return (
                            <tr key={a} className={ri === rowNow ? "now" : ""}>
                              <th className={"tm" + (rowStrong ? "" : " soft")}>{a} – {b}</th>
                              {tb.body[ri].map((c, ci) => {
                                if (!c) return null;
                                const last = ri + c.rs - 1, strong = strongOf(c, ci);
                                const live = ci <= ti && ti < ci + c.cs && ri <= rowNow && rowNow <= last && c.text !== "";
                                return (
                                  <td key={ci} rowSpan={c.rs > 1 ? c.rs : undefined} colSpan={c.cs > 1 ? c.cs : undefined}
                                    className={[c.quiet ? "q" : "", strong ? "" : "soft", live ? "live" : ""].join(" ")}>
                                    {live && <span className="tt-now">{NOW[lang]}</span>}
                                    {c.text}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </IndexLayout>
        )}
        <Footer />
      </main>
    </div>
  );
}

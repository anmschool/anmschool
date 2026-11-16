import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLang, trackName } from "../i18n";
import { dayOf, Footer, Head, todayIso, useContent, useMe, useSeason } from "../ui";
import { forTrack } from "./shared";

const TRACKS = ["청지기", "대학청년·일반", "미래세대", "어린이"];
/** 일정 종류 → 표시 강약: 저녁성회는 강조, 식사·휴식은 흐리게 */
const kindOf = (t: string) => /Celebration/.test(t) ? "main" : /식사|휴식|취침|개인 기도|귀가|breakfast|lunch|dinner|meal|rest|break|sleep|bed|personal prayer|home|早餐|午餐|晚餐|休息|就寝|祷告|回家/i.test(t) ? "quiet" : "";

export default function Schedule() {
  const { content } = useContent();
  const s = useSeason();
  const { me } = useMe(s?.id);
  const { t, lang } = useLang();
  const [qs] = useSearchParams();
  const mine = qs.get("track") || me?.track?.replace(/^온라인\s*/, "");
  const [chosen, setChosen] = useState<string | null>(null);
  const pick = chosen ?? (TRACKS.find(k => mine && trackName(mine, "ko") === trackName(k, "ko")) || TRACKS[0]);
  const items = (content?.schedule ?? []).filter(x => x.project === s?.id && forTrack(x.track, pick));
  const days = Array.from(new Set(items.map(x => x.date))).sort();
  const today = todayIso();
  const [day, setDay] = useState<string | null>(null);
  const cur = day && days.includes(day) ? day : days.includes(today) ? today : days[0];
  const nowHm = new Date(Date.now() + 9 * 3600e3).toISOString().slice(11, 16);
  const list = items.filter(x => x.date === cur).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="app">
      <Head label="Schedule" title={t("schedule")} />
      <main className="body">
        <div className="chips" role="group" aria-label="Course">
          {TRACKS.map(k => (
            <button key={k} aria-pressed={k === pick} onClick={() => { setChosen(k); setDay(null); }}>{trackName(k, lang)}</button>
          ))}
        </div>
        {days.length === 0 ? <div className="empty">{t("noSchedule")}</div> : (
          <>
            <div className="days" role="group">
              {days.map(d => (
                <button key={d} aria-pressed={d === cur} onClick={() => setDay(d)}>
                  <span className="d">{Number(d.slice(5, 7))}/{Number(d.slice(8))}</span><span className="w">{dayOf(d)}{d === today ? ` · ${t("today")}` : ""}</span>
                </button>
              ))}
            </div>
            <p className="day-cap">Day {days.indexOf(cur) + 1}</p>
            <div className="slots">
              {list.map((x, i) => {
                const now = cur === today && x.start <= nowHm && (x.end || "99") > nowHm;
                return (
                  <div key={i} className={["slot", kindOf(x.title), now ? "now" : ""].join(" ")}>
                    <span className="time">{x.start}{x.end ? <><br /><span className="end">{x.end}</span></> : ""}</span>
                    <div>
                      {x.note && kindOf(x.title) !== "quiet" && <div className="tag">{x.note}</div>}
                      <div className="what">{x.title}</div>
                      {x.place && <div className="small">{x.place}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <Footer />
      </main>
    </div>
  );
}

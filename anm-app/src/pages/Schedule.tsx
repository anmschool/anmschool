import { useState } from "react";
import { useLang } from "../i18n";
import { dayOf, Footer, Head, todayIso, useContent, useMe, useSeason } from "../ui";
import { forTrack } from "./shared";

export default function Schedule() {
  const { content } = useContent();
  const s = useSeason();
  const { me } = useMe(s?.id);
  const { t } = useLang();
  const items = (content?.schedule ?? []).filter(x => x.project === s?.id && forTrack(x.track, me?.track));
  const days = Array.from(new Set(items.map(x => x.date)));
  const today = todayIso();
  const [day, setDay] = useState<string | null>(null);
  const cur = day ?? (days.includes(today) ? today : days[0]);
  const nowHm = new Date(Date.now() + 9 * 3600e3).toISOString().slice(11, 16);

  return (
    <div className="app">
      <Head label="Schedule" title={t("schedule")} />
      <main className="body">
        {me && <span className="small">{me.track} {t("trackOnly")}</span>}
        {days.length === 0 ? <div className="empty">{t("noSchedule")}</div> : (
          <>
            <div className="days" role="group">
              {days.map(d => (
                <button key={d} aria-pressed={d === cur} onClick={() => setDay(d)}>
                  <span className="d">{Number(d.slice(8))}</span><span className="w">{dayOf(d)}{d === today ? ` · ${t("today")}` : ""}</span>
                </button>
              ))}
            </div>
            <div>
              {items.filter(x => x.date === cur).map((x, i) => {
                const now = cur === today && x.start <= nowHm && (x.end || "99") > nowHm;
                return (
                  <div key={i} className={"slot" + (now ? " now" : "")}>
                    <span className="time">{x.start}{x.end ? `–${x.end}` : ""}</span>
                    <div><div className="what">{x.title}</div>{(x.place || x.note) && <div className="small">{[x.place, x.note].filter(Boolean).join(" · ")}</div>}</div>
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

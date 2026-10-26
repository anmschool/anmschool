import { useLang } from "../i18n";
import type { Notice, Place, ScheduleItem } from "../types";
import { fmtDate, RichText, todayIso } from "../ui";

export function NoticeList({ items }: { items: Notice[] }) {
  const { t } = useLang();
  if (!items.length) return <div className="empty">{t("noNotice")}</div>;
  return (
    <div className="stack">
      {items.map((n, i) => (
        <article key={i} className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="code">{fmtDate(n.date)}</span>
            <span className="row">{n.pinned && <span className="pill plain">📌</span>}{n.track !== "전체" && <span className="pill plain dim">{n.track}</span>}</span>
          </div>
          <span className="title">{n.title}</span>
          <RichText text={n.body} />
        </article>
      ))}
    </div>
  );
}

/** 트랙 필터: "전체" 또는 "미래세대, 청지기" 같은 목록 */
export const forTrack = (rowTrack: string, track?: string) =>
  !track || !rowTrack || rowTrack === "전체" || rowTrack.split(/[,/·]\s*/).some(x => x.trim() && track.includes(x.trim()));

export function ScheduleList({ items }: { items: ScheduleItem[] }) {
  const { t } = useLang();
  if (!items.length) return <div className="empty">{t("noSchedule")}</div>;
  const days = Array.from(new Set(items.map(s => s.date)));
  const today = todayIso();
  const nowHm = new Date(Date.now() + 9 * 3600e3).toISOString().slice(11, 16);
  return (
    <div className="stack">
      {days.map(d => (
        <div key={d}>
          <div className="day">{fmtDate(d)}{d === today ? ` · ${t("today")}` : ""}</div>
          {items.filter(s => s.date === d).map((s, i) => {
            const now = d === today && s.start <= nowHm && (s.end || "99") > nowHm;
            return (
              <div key={i} className={"slot" + (now ? " now" : "")}>
                <span className="time">{s.start}{s.end ? `–${s.end}` : ""}</span>
                <div><div style={{ fontWeight: 500 }}>{s.title}</div>{(s.place || s.note) && <div className="hint">{[s.place, s.note].filter(Boolean).join(" · ")}</div>}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function PlaceList({ items, highlight }: { items: Place[]; highlight?: string[] }) {
  const sorted = highlight?.length ? [...items].sort((a, b) => Number(highlight.includes(b.name)) - Number(highlight.includes(a.name))) : items;
  return (
    <div className="stack">
      {sorted.map(p => (
        <article key={p.name} className="card place">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="title">{p.name}</span>
            {p.kind && <span className="pill plain dim">{p.kind}</span>}
          </div>
          {p.image && <img src={p.image} alt={p.name} loading="lazy" />}
          {p.body && <span className="sub">{p.body}</span>}
          {p.video && <video src={p.video} controls preload="none" playsInline poster={p.image} />}
          {p.map && <a className="btn ghost small" href={p.map} target="_blank" rel="noreferrer">지도 열기 ↗</a>}
        </article>
      ))}
    </div>
  );
}

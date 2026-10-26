import { useState, type FormEvent } from "react";
import { adminStats, DEMO, ERROR_TEXT } from "../api";
import { useLang } from "../i18n";
import type { Stats } from "../types";
import { Footer, Head, Section, useContent, useSeason } from "../ui";

export default function Admin() {
  const { t } = useLang();
  const { content } = useContent();
  const season = useSeason();
  const projects = (content?.projects ?? []).filter(p => p.login);
  const [project, setProject] = useState("");
  const [pin, setPin] = useState(() => { try { return sessionStorage.getItem("anm.pin") ?? ""; } catch { return ""; } });
  const [stats, setStats] = useState<Stats | null>(null);
  const [who, setWho] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pid = project || season?.id || projects[0]?.id || "";

  const load = async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true); setErr(null);
    try {
      const r = await adminStats(pin, pid);
      if (r.ok) { setStats(r.stats); setWho(r.admin); try { sessionStorage.setItem("anm.pin", pin); } catch { /* */ } }
      else setErr(ERROR_TEXT[r.error] ?? ERROR_TEXT.server);
    } catch { setErr(ERROR_TEXT.network); }
    finally { setBusy(false); }
  };
  const paid = stats ? stats.tracks.reduce((s, x) => s + x.paid, 0) : 0;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + "%" : "–");

  return (
    <div className="app">
      <Head label="Admin" title={t("admin")} />
      <main className="body">
        <p className="sub" style={{ margin: 0 }}>공지·시간표·안내·사역 목록은 드라이브 ‘ANM 앱’ 관리 시트에서 고칩니다. 여기서는 현황만 봅니다.</p>
        <form onSubmit={load} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {projects.length > 1 && (
            <div className="days" role="group">
              {projects.map(p => <button type="button" key={p.id} aria-pressed={pid === p.id} onClick={() => setProject(p.id)} style={{ minWidth: 0 }}><span className="w" style={{ fontSize: 13 }}>{p.id}</span></button>)}
            </div>
          )}
          <div className="field">
            <label htmlFor="pin">PIN · {t("pin")}</label>
            <input id="pin" inputMode="numeric" type="password" autoComplete="off" value={pin} onChange={e => setPin(e.target.value)} />
          </div>
          {err && <div className="error" role="alert">{err}</div>}
          <button className="btn" disabled={busy || !pid}>{busy ? t("checking") : stats ? t("refresh") : t("enter")}</button>
          {DEMO && <div className="note">데모 PIN — 000000</div>}
        </form>

        {stats && (
          <>
            <div className="stats">
              <div><span className="label mute">Registered</span><div className="n">{stats.total}</div><span className="small">취소 {stats.cancelled}</span></div>
              <div><span className="label mute">Paid</span><div className="n">{pct(paid, stats.total)}</div><span className="small">{paid}명</span></div>
              <div><span className="label mute">Rooms</span><div className="n">{stats.lodging.assigned}<span className="small"> / {stats.lodging.lines}</span></div><span className="small">{t("lodgingDone")}</span></div>
              <div><span className="label mute">Check-in</span><div className="n">{stats.checkedIn}</div><span className="small">{t("checkedIn")}</span></div>
            </div>
            <Section label={who} title={t("track")}>
              <div className="tbl">
                <table>
                  <thead><tr><th>Track</th><th>Total</th><th>형제</th><th>자매</th><th>완납</th><th>부분</th><th>미납</th></tr></thead>
                  <tbody>{stats.tracks.map(r => (
                    <tr key={r.track}><td>{r.track}</td><td>{r.total}</td><td>{r.brother}</td><td>{r.sister}</td><td>{r.paid}</td><td>{r.partial}</td><td>{r.unpaid}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              <span className="small">{t("groups")} {stats.groups} · {new Date(stats.updatedAt).toLocaleString("ko-KR")}</span>
            </Section>
          </>
        )}
        <Footer />
      </main>
    </div>
  );
}

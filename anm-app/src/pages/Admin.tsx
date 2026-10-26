import { useState, type FormEvent } from "react";
import { adminStats, DEMO, ERROR_TEXT } from "../api";
import { useLang } from "../i18n";
import type { Stats } from "../types";
import { Footer, Section, useContent, Wash } from "../ui";

export default function Admin() {
  const { t } = useLang();
  const { content } = useContent();
  const projects = (content?.projects ?? []).filter(p => p.login);
  const [project, setProject] = useState("");
  const [pin, setPin] = useState(() => { try { return sessionStorage.getItem("anm.pin") ?? ""; } catch { return ""; } });
  const [stats, setStats] = useState<Stats | null>(null);
  const [who, setWho] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pid = project || projects[0]?.id || "";

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

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + "%" : "–");

  return (
    <main className="page">
      <Wash back="/">
        <span className="eyebrow" style={{ display: "block", marginTop: 18 }}>Admin</span>
        <h1 style={{ marginTop: 6 }}>{t("admin")}</h1>
        <p className="lede">공지·시간표·안내는 'ANM 앱' 관리 시트에서 고칩니다. 여기서는 현황만 봅니다.</p>
      </Wash>

      <form className="stack" onSubmit={load}>
        {projects.length > 1 && (
          <div className="tabs" role="tablist">
            {projects.map(p => <button type="button" key={p.id} role="tab" aria-selected={pid === p.id} onClick={() => setProject(p.id)}>{p.id}</button>)}
          </div>
        )}
        <div className="field">
          <label htmlFor="pin">{t("pin")}</label>
          <input id="pin" inputMode="numeric" type="password" autoComplete="off" value={pin} onChange={e => setPin(e.target.value)} />
        </div>
        {err && <div className="error" role="alert">{err}</div>}
        <button className="btn" disabled={busy || !pid}>{busy ? t("checking") : stats ? t("refresh") : t("enter")}</button>
        {DEMO && <div className="note">데모 PIN: 000000</div>}
      </form>

      {stats && (
        <>
          <div className="stat-grid">
            <div className="stat"><div className="n">{stats.total}</div><div className="l">{t("total")} (취소 {stats.cancelled})</div></div>
            <div className="stat"><div className="n">{pct(stats.tracks.reduce((s, x) => s + x.paid, 0), stats.total)}</div><div className="l">{t("paid")}</div></div>
            <div className="stat"><div className="n">{stats.lodging.assigned}<span style={{ fontSize: 16, color: "var(--sub)" }}> / {stats.lodging.lines}</span></div><div className="l">{t("lodgingDone")}</div></div>
            <div className="stat"><div className="n">{stats.checkedIn}</div><div className="l">{t("checkedIn")}</div></div>
          </div>
          <Section title={t("track")} eyebrow={who}>
            <div className="tbl">
              <table>
                <thead><tr><th>{t("track")}</th><th>{t("total")}</th><th>형제</th><th>자매</th><th>완납</th><th>부분</th><th>미납</th></tr></thead>
                <tbody>
                  {stats.tracks.map(r => (
                    <tr key={r.track}><td>{r.track}</td><td>{r.total}</td><td>{r.brother}</td><td>{r.sister}</td><td>{r.paid}</td><td>{r.partial}</td><td>{r.unpaid}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hint">{t("groups")} {stats.groups} · {new Date(stats.updatedAt).toLocaleString("ko-KR")}</p>
          </Section>
        </>
      )}
      <Footer />
    </main>
  );
}

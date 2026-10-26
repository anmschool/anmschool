import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import qrcode from "qrcode-generator";
import { cachedMe, getToken, logout, refreshMe } from "../api";
import { useLang } from "../i18n";
import type { Me } from "../types";
import { CopyButton, Footer, fmtRange, Section, Skeleton, useContent, useProject, Wash, won } from "../ui";
import { NoticeList, PlaceList, ScheduleList, forTrack } from "./parts";

type Tab = "home" | "schedule" | "notices" | "places";

function PayCard({ me }: { me: Me }) {
  const { t } = useLang();
  const pay = me.payment;
  const cls = { paid: "ok", partial: "warn", unpaid: "bad", checking: "dim", cancelled: "dim" }[pay.state];
  const label = { paid: t("paid"), partial: t("partial"), unpaid: t("unpaid"), checking: t("checkingPay"), cancelled: t("cancelled") }[pay.state];
  const needPay = pay.state === "unpaid" || pay.state === "partial";
  return (
    <section className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>{t("payment")}</h2>
        <span className={`pill ${cls}`}>{label}</span>
      </div>
      {me.group ? (
        <p className="sub" style={{ margin: 0 }}>{t("groupPaid")} · {me.group.name} ({me.group.status})</p>
      ) : null}
      <dl className="kv">
        {pay.fee != null && <><dt>{t("fee")}</dt><dd className="num">{won(pay.fee)}</dd></>}
        {needPay && pay.account && <><dt>{t("account")}</dt><dd><div style={{ whiteSpace: "nowrap" }} className="num">{pay.account}</div><div className="hint">예금주 경배와찬양</div><div style={{ marginTop: 6 }}><CopyButton text={pay.account.replace(/^\S+\s/, "")} /></div></dd></>}
        {needPay && !me.group && <><dt>{t("depositor")}</dt><dd>{pay.depositorHint}</dd></>}
      </dl>
    </section>
  );
}

function LodgingCard({ me }: { me: Me }) {
  const { t } = useLang();
  if (me.online) return <section className="card"><h2>{t("lodging")}</h2><p className="sub" style={{ margin: 0 }}>{t("online")}</p></section>;
  return (
    <section className="card">
      <h2>{t("lodging")}</h2>
      {me.lodging.length === 0 && <p className="sub" style={{ margin: 0 }}>{t("pendingNote")}</p>}
      {me.lodging.map(l => (
        <div key={l.segment} className="stack" style={{ gap: 4, paddingTop: 6, borderTop: "1px solid var(--hair)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="code">{me.lodging.length > 1 ? `${t("segment")} ${l.segment} · ` : ""}{fmtRange(l.checkIn, l.checkOut)}</span>
            <span className={`pill ${l.room ? "ok" : "dim"}`}>{l.room ? t("assigned") : t("pending")}</span>
          </div>
          {l.room ? (
            <div className="room"><span className="bld">{l.building}</span><span className="big">{l.room}</span><span className="sub">호</span></div>
          ) : <span className="sub">{t("pendingNote")}</span>}
        </div>
      ))}
    </section>
  );
}

function CheckinCard({ me }: { me: Me }) {
  const { t } = useLang();
  const svg = useMemo(() => {
    const q = qrcode(0, "M");
    q.addData(me.code);
    q.make();
    return q.createSvgTag({ margin: 0, scalable: true });
  }, [me.code]);
  return (
    <section className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>{t("checkin")}</h2>
        {me.checkedIn && <span className="pill ok">{t("checkedIn")}</span>}
      </div>
      <p className="sub" style={{ margin: 0 }}>{t("checkinNote")}</p>
      <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} aria-label={me.code} />
      <span className="code" style={{ textAlign: "center" }}>{me.code}</span>
    </section>
  );
}

export default function MePage() {
  const { id = "" } = useParams();
  const p = useProject(id);
  const { content } = useContent();
  const { t } = useLang();
  const nav = useNavigate();
  const [me, setMe] = useState<Me | null>(cachedMe(id));
  const [tab, setTab] = useState<Tab>("home");
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (!getToken(id)) return;
    refreshMe(id).then(r => { if (r.ok) { setMe(r.me); setStale(false); } else if (r.error === "network" || r.error === "server") setStale(true); else nav(`/p/${id}/login`, { replace: true }); })
      .catch(() => setStale(true));
  }, [id, nav]);

  if (!getToken(id)) return <Navigate to={`/p/${id}/login`} replace />;
  if (!me) return <main className="page"><Wash project={p} back="/" /><Skeleton lines={6} /></main>;

  const notices = (content?.notices ?? []).filter(n => (n.project === id || n.project === "전체") && forTrack(n.track, me.track));
  const schedule = (content?.schedule ?? []).filter(s => s.project === id && forTrack(s.track, me.track));
  const places = (content?.places ?? []).filter(x => x.project === id);
  const myBuildings = me.lodging.map(l => l.building).filter(Boolean);

  return (
    <main className="page">
      <Wash project={p} back="/">
        <span className="label wine">{me.projectTitle}</span>
        <h1 style={{ marginTop: 6 }}>{me.name}{t("hello")}</h1>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="pill plain" style={{ background: p?.color ?? "var(--wine)", color: "#fff" }}>{me.track}</span>
          {me.kind && <span className="pill plain dim">{me.kind}</span>}
          {me.church && <span className="pill plain dim">{me.church}</span>}
        </div>
        {me.period.length > 0 && <div className="meta num">{me.period.map(([a, b]) => fmtRange(a, b)).join("  ·  ")}</div>}
      </Wash>

      <div className="tabs" role="tablist">
        {([["home", t("home")], ["schedule", t("schedule")], ["notices", t("notices")], ["places", t("places")]] as [Tab, string][]).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}{k === "notices" && notices.length ? ` ${notices.length}` : ""}</button>
        ))}
      </div>

      {stale && <div className="note">{t("offline")}</div>}
      {me.cancelled && <div className="error">{t("cancelled")}</div>}

      {tab === "home" && (
        <div className="stack" style={{ gap: 14 }}>
          <PayCard me={me} />
          <LodgingCard me={me} />
          {notices[0] && <Section title={t("notices")}><NoticeList items={notices.slice(0, 1)} /></Section>}
          <CheckinCard me={me} />
          <button className="btn ghost" onClick={() => { logout(id); nav(`/p/${id}`, { replace: true }); }}>{t("logout")}</button>
        </div>
      )}
      {tab === "schedule" && <Section title={t("schedule")} eyebrow={me.track}><ScheduleList items={schedule} /></Section>}
      {tab === "notices" && <Section title={t("notices")}><NoticeList items={notices} /></Section>}
      {tab === "places" && <Section title={t("places")}><PlaceList items={places} highlight={myBuildings} /></Section>}
      <Footer />
    </main>
  );
}

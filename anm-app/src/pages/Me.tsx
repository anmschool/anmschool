import { Link, Navigate, useNavigate } from "react-router-dom";
import { getToken, logout } from "../api";
import { useLang } from "../i18n";
import { CopyButton, fmtRange, Footer, Head, Section, Skeleton, useMe, useSeason, won } from "../ui";
import { payView } from "./shared";

export default function MePage() {
  const s = useSeason();
  const { t } = useLang();
  const nav = useNavigate();
  const { me, stale } = useMe(s?.id);

  if (s && !getToken(s.id)) return <Navigate to="/login" replace />;
  if (!me) return <div className="app"><Head title={t("myInfo")} /><main className="body"><Skeleton lines={6} /></main></div>;
  const pv = payView(me, t);
  const pay = me.payment;

  return (
    <div className="app">
      <Head label="My Registration" title={`${me.name}${t("hello")}`} />
      <main className="body">
        {stale && <div className="note">{t("offline")}</div>}
        {me.cancelled && <div className="error">{t("cancelled")}</div>}

        <dl className="rows">
          <dt>{t("track")}</dt><dd><strong>{me.track}</strong>{me.kind ? ` · ${me.kind}` : ""}</dd>
          {me.church && <><dt>{t("church")}</dt><dd>{me.church}</dd></>}
          {me.period.length > 0 && <><dt>{t("period")}</dt><dd className="num">{me.period.map(([a, b]) => fmtRange(a, b)).join(" / ")}</dd></>}
        </dl>

        <div className="cta">
          <Link className="btn" to="/schedule">{t("schedule")}</Link>
          <Link className="btn line" to="/guide">{t("guide")}</Link>
        </div>

        <Section label="Fee" title={t("payment")}>
          <dl className="rows">
            <dt>{t("state")}</dt><dd><span className={`state ${pv.cls}`}>{pv.label}</span></dd>
            {pay.fee != null && <><dt>{t("fee")}</dt><dd className="num">{won(pay.fee)}</dd></>}
            {me.group && <><dt>{t("groupPaid")}</dt><dd>{me.group.name} · {me.group.status}</dd></>}
            {pv.needPay && !me.group && <><dt>{t("depositor")}</dt><dd>{pay.depositorHint}</dd></>}
            {pv.needPay && pay.account && <><dt>{t("account")}</dt><dd><div className="num">{pay.account}</div><div className="small">예금주 경배와찬양</div><div style={{ marginTop: 8 }}><CopyButton acc text={pay.account} /></div></dd></>}
          </dl>
        </Section>

        <Section label="Room" title={t("lodging")}>
          {me.online ? <p className="sub" style={{ margin: 0 }}>{t("online")}</p>
            : me.lodging.length === 0 ? <p className="sub" style={{ margin: 0 }}>{t("pendingNote")}</p>
            : <div>{me.lodging.map(l => (
              <div key={l.segment} className="stay">
                <span className="small num">{me.lodging.length > 1 ? `${t("segment")} ${l.segment} · ` : ""}{fmtRange(l.checkIn, l.checkOut)}</span>
                {l.room ? <div className="room"><span className="b">{l.building}</span><span className="n">{l.room}</span><span className="sub">호</span></div>
                  : <span className="state dim">{t("pendingNote")}</span>}
              </div>
            ))}<Link to="/places" className="btn text">{t("places")} →</Link></div>}
        </Section>


        <button className="btn line" onClick={() => { if (s) logout(s.id); nav("/", { replace: true }); }}>{t("logout")}</button>
        <Footer />
      </main>
    </div>
  );
}

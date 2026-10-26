import { useLang } from "../i18n";
import { Footer, Head, useContent, useMe, useSeason } from "../ui";

export default function Places() {
  const { content } = useContent();
  const s = useSeason();
  const { me } = useMe(s?.id);
  const { t } = useLang();
  const mine = (me?.lodging ?? []).map(l => l.building).filter(Boolean);
  const isMine = (name: string) => mine.some(b => name.includes(b) || b.includes(name));
  const places = (content?.places ?? []).filter(p => p.project === s?.id).sort((a, b) => Number(isMine(b.name)) - Number(isMine(a.name)) || a.order - b.order);
  return (
    <div className="app">
      <Head label="Campus" title={t("places")} />
      <main className="body">
        {s?.venue && <p className="sub" style={{ margin: 0 }}>{s.venue}</p>}
        {places.length === 0 && <div className="empty">{t("comingSoon")}</div>}
        <div className="place-grid">
        {places.map(p => (
          <article key={p.name} className="place">
            <div className="place-head"><span className="t">{p.name}</span>{isMine(p.name) ? <span className="mine">My Room</span> : p.kind && <span className="label mute">{p.kind}</span>}</div>
            {p.image && <img src={p.image} alt={p.name} loading="lazy" />}
            {p.body && <span className="sub">{p.body}</span>}
            {p.video && <video src={p.video} controls preload="none" playsInline poster={p.image} />}
            {p.map && <a className="btn text" style={{ justifyContent: "flex-start", padding: 0 }} href={p.map} target="_blank" rel="noreferrer">{t("openMap")} ↗</a>}
          </article>
        ))}
        </div>
        <Footer />
      </main>
    </div>
  );
}

import { useLang, type Lang } from "../i18n";
import { Footer, Head, useContent, useMe, useSeason } from "../ui";

type L = Record<Lang, string>;
/** 장소 종류(시트 '종류') → 큰 제목. 장소 이름은 그 아래 작게 */
const GROUPS: { id: string; kinds: string[]; label: L }[] = [
  { id: "worship", kinds: ["예배", "강의"], label: { ko: "예배·강의", en: "Worship & sessions", zh: "敬拜·讲座" } },
  { id: "dining", kinds: ["식당", "식사"], label: { ko: "식사", en: "Meals", zh: "用餐" } },
  { id: "lodging", kinds: ["숙소"], label: { ko: "숙소", en: "Rooms", zh: "宿舍" } },
];
const PARK: L = { ko: "주차", en: "Parking", zh: "停车" };
const PARK_ROWS: { t: L; img: string; naver: string; google: string }[] = [
  { t: { ko: "채플관 옆 주차장", en: "Parking lot next to the Chapel", zh: "礼拜堂旁停车场" }, img: "/images/facility/parking-chapel.png", naver: "https://naver.me/GyYWndK8", google: "https://maps.app.goo.gl/H5193Vf8fMRFwHYw8" },
  { t: { ko: "채플관 옆 오른쪽 길로 올라가 온실 앞", en: "Up the road on the right of the Chapel, in front of the greenhouse", zh: "沿礼拜堂右侧道路上行，温室前" }, img: "/images/facility/parking-greenhouse.png", naver: "", google: "" },
];
/** 장소별 지도 (시트 지도 칸보다 우선) */
const LINKS: Record<string, [string, string]> = {
  "60주년 기념 채플관": ["https://naver.me/GyYWndK8", "https://maps.app.goo.gl/H5193Vf8fMRFwHYw8"],
  "식당": ["https://naver.me/FlBWIDS1", "https://maps.app.goo.gl/htBX67Hg14YKs43L7"],
  "5동": ["https://naver.me/GJZ6k3oY", "https://maps.app.goo.gl/im9RUAJ1g4W9NiNc7"],
  "명덕관": ["https://naver.me/x9BeSraH", "https://maps.app.goo.gl/KdwD1Qv3cyHaM35AA"],
};
const PARK_NOTE: L = { ko: "주차할 수 있는 곳은 아래 두 곳입니다.", en: "You can park in these two areas.", zh: "可停车区域为以下两处。" };
/** 영상 파일 이름(course1_main_gate_to_chapel.mp4) → "정문 → 채플관" */
const SPOT: Record<string, L> = {
  main_gate: { ko: "정문", en: "Main gate", zh: "正门" }, chapel: { ko: "채플관", en: "Chapel", zh: "礼拜堂" },
  restaurant: { ko: "식당", en: "Dining hall", zh: "食堂" }, myeongdeok: { ko: "명덕관", en: "Myeongdeok Hall", zh: "明德馆" },
  dorm5: { ko: "생활관 5동", en: "Dorm 5", zh: "宿舍5栋" },
};
function routeOf(v: string, lang: Lang) {
  const m = v.match(/([a-z0-9]+(?:_[a-z0-9]+)*?)_to_([a-z0-9_]+)\.\w+$/i);
  if (!m) return "";
  const a = m[1].replace(/^course\d+_/, ""), b = m[2];
  return `${SPOT[a]?.[lang] ?? a} → ${SPOT[b]?.[lang] ?? b}`;
}
const MAPS: L = { ko: "네이버지도", en: "Naver Map", zh: "Naver地图" };
const GMAP: L = { ko: "구글맵", en: "Google Maps", zh: "Google地图" };

export default function Places() {
  const { content } = useContent();
  const s = useSeason();
  const { me } = useMe(s?.id);
  const { t, lang } = useLang();
  const mine = (me?.lodging ?? []).map(l => l.building).filter(Boolean);
  const isMine = (name: string) => mine.some(b => name.includes(b) || b.includes(name));
  const places = (content?.places ?? []).filter(p => p.project === s?.id).sort((a, b) => a.order - b.order);
  const groups = [
    ...GROUPS.map(g => ({ ...g, items: places.filter(p => g.kinds.includes(p.kind ?? "")) })),
    { id: "etc", label: { ko: "기타", en: "Other", zh: "其他" }, items: places.filter(p => !GROUPS.some(g => g.kinds.includes(p.kind ?? ""))) },
  ].filter(g => g.items.length);
  const park = s?.id === "2027W";

  return (
    <div className="app">
      <Head label="Campus" title={t("places")} />
      <main className="body">
        {s?.venue && <p className="sub" style={{ margin: 0 }}>{s.venue}</p>}
        {places.length === 0 && <div className="empty">{t("comingSoon")}</div>}
        {groups.length > 0 && (
          <nav className="pl-nav" aria-label={t("toc")}>
            {groups.map(g => <a key={g.id} href={`#${g.id}`} onClick={e => { e.preventDefault(); document.getElementById(g.id)?.scrollIntoView({ behavior: "smooth" }); }}>{g.label[lang]}</a>)}
            {park && <a href="#parking" onClick={e => { e.preventDefault(); document.getElementById("parking")?.scrollIntoView({ behavior: "smooth" }); }}>{PARK[lang]}</a>}
          </nav>
        )}
        {groups.map(g => (
          <section key={g.id} id={g.id} className="pl-sec">
            <h2>{g.label[lang]}</h2>
            <div className={"pl-list" + (g.items.length > 1 ? " two" : "")}>
              {g.items.map(p => (
                <article key={p.name} className="pl">
                  <div className="pl-head"><h3>{p.name}</h3>{isMine(p.name) && <span className="mine">My Room</span>}</div>
                  {p.body && <p className="sub">{p.body}</p>}
                  {p.image && <img src={p.image} alt={p.name} loading="lazy" />}
                  {p.video && (
                    <figure className="pl-video">
                      <figcaption><span className="rt">{t("route")}</span>{routeOf(p.video, lang)}</figcaption>
                      <video src={p.video} controls preload="none" playsInline poster={p.image} />
                    </figure>
                  )}
                  <div className="pl-btns">
                    {(LINKS[p.name]?.[0] || p.map) && <a className="pill" href={LINKS[p.name]?.[0] || p.map} target="_blank" rel="noreferrer">{MAPS[lang]} ↗</a>}
                    {LINKS[p.name]?.[1] && <a className="pill" href={LINKS[p.name][1]} target="_blank" rel="noreferrer">{GMAP[lang]} ↗</a>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {park && (
          <section id="parking" className="pl-sec">
            <h2>{PARK[lang]}</h2>
            <p className="sub" style={{ margin: 0 }}>{PARK_NOTE[lang]}</p>
            <div className="pl-list two">
              {PARK_ROWS.map((r, i) => (
                <article key={r.img} className="pl">
                  <div className="pl-head"><h3><span className="pk">P{i + 1}</span>{r.t[lang]}</h3></div>
                  <img src={r.img} alt={r.t[lang]} loading="lazy" className="pk-map" />
                  {r.naver && <div className="pl-btns"><a className="pill" href={r.naver} target="_blank" rel="noreferrer">{MAPS[lang]} ↗</a><a className="pill" href={r.google} target="_blank" rel="noreferrer">{GMAP[lang]} ↗</a></div>}
                </article>
              ))}
            </div>
          </section>
        )}
        <Footer />
      </main>
    </div>
  );
}

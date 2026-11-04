import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../i18n";
import { fmtRange, Footer, Head, Icon, Section, useContent, useSeason } from "../ui";

const ABOUT: { en: string; kr: string; verse?: string; ref?: string; body: string[]; info?: string; to?: string }[] = [
  {
    en: "Worship & Praise School", kr: "경배와찬양학교",
    verse: "“마음을 다하고 성품을 다하고 힘을 다하여 네 하나님 여호와를 사랑하라”", ref: "신 6:4–9, 11:13–21",
    body: [
      "국내와 해외 개척지에서 1년에 두 번, 여름과 겨울에 3박 4일에서 4박 5일간 구별된 장소에서 훈련을 갖습니다. 대학생을 포함한 일반인, 중고등부, 어린이, 예배예술인과 목회자 및 선교사 가정을 위한 경배와찬양학교를 진행합니다.",
      "첫날 훈련 안내 시간에 경배와찬양학교에 기대하는 기도제목을 적으며 훈련이 시작됩니다. 다음 날 아침 7시 침묵기도로 잠잠히 하나님의 음성을 듣고, 오전 강의와 오후 선택강의·학습활동을 통해 주제 말씀을 듣고 적용합니다.",
      "저녁 집회는 뜨거운 찬양과 기도 속에 성령을 경험하는 시간입니다. 먼저 하나님을 만나고, 삶을 헌신하여 전적으로 하나님의 뜻을 따라 살기로 결정하며, 감추어졌던 쓴 뿌리와 성품, 가정의 기도제목을 가지고 기도하면서 새로운 출발을 시작합니다.",
    ],
    to: "/",
  },
  {
    en: "Thursday Worship", kr: "목요모임",
    body: [
      "하나님의 임재를 경험하는 예배, 영적 회복과 치유가 있는 예배, 십자가의 길과 순교자의 삶을 살기로 결단하는 예배.",
      "하나님께서는 이 세대에 ‘교회는 선교’임을 깨닫고 하나님의 부르심을 따라갈 수 있는 사람들을 찾고 계십니다. 주님을 위해 생명을 바치겠다는 결단으로 열방을 향해 행진하기 원하는 모든 하나님의 사람들을 주님의 이름으로 경배와찬양 목요모임에 초대합니다.",
    ],
    info: "매주 목요일 오후 6시 30분 · 온누리교회 서빙고성전 (오후 5–6시 중보기도로 예배를 준비합니다)",
  },
  {
    en: "7000 Gathering", kr: "7000모임",
    body: [
      "7000모임은 영감예술 시대에 천상의 예배를 드리면서 ‘재헌신’을 하기 위한 경배와찬양의 시대적인 모임입니다.",
      "하나님의 약속의 말씀 학개 2장, 열왕기상 19장, 빌립보서 3장을 통하여 ‘청지기의 삶’과 ‘고난의 축복’ 가운데 살아갈 수 있도록 사명을 주셨습니다. 빛의 갑옷을 입은 7000 청지기들을 통하여 새 예루살렘을 향한 기대감을 가지고 하나님의 선한 뜻을 이루는 통로가 되기를 기도합니다.",
    ],
    info: "매주 토요일 오후 4시 · 서빙고 경배와찬양 훈련원 (서울 용산구 서빙고로59길 21-2)",
  },
];

export default function Notices() {
  const { content } = useContent();
  const s = useSeason();
  const { t } = useLang();
  const loc = useLocation();
  const others = (content?.projects ?? []).filter(p => p.id !== s?.id && p.id !== "매주예배");

  useEffect(() => {
    if (loc.hash === "#ministries") document.getElementById("ministries")?.scrollIntoView({ behavior: "smooth" });
  }, [loc.hash, content]);

  return (
    <div className="app">
      <Head label="Notices & Ministries" title={t("noticesMinistries")} />
      <main className="body">
        <div>
        {(
          <div id="ministries">
            <Section label="Ministries" title={t("otherMinistries")}>
              <div>
                {ABOUT.map(m => (
                  <article key={m.kr} className="min-about">
                    <span className="label">{m.en}</span>
                    <h3>{m.kr}</h3>
                    {m.verse && <p className="verse">{m.verse}<span className="ref">{m.ref}</span></p>}
                    {m.body.map((x, i) => <p key={i}>{x}</p>)}
                    {m.info && <p className="info">{m.info}</p>}
                    {m.to && <Link to={m.to} className="more">2027 WINTER 안내 →</Link>}
                  </article>
                ))}
                {others.map(p => (
                  <Link key={p.id} to={`/p/${encodeURIComponent(p.id)}`} className="ministry" style={{ ["--c" as string]: p.color }}>
                    <span className="bar-c" />
                    <span>
                      <span className="label kr mute" style={{ display: "block", fontSize: 12 }}>{p.kind} · {p.status === "진행" ? t("now") : p.status === "준비" ? t("soon") : t("past")}</span>
                      <span className="t">{p.title}</span>
                      {(p.start || p.subtitle) && <span className="small" style={{ display: "block" }}>{p.start ? fmtRange(p.start, p.end) : p.subtitle}</span>}
                    </span>
                    <span className="arrow">{Icon.arrow}</span>
                  </Link>
                ))}
              </div>
            </Section>
          </div>
        )}
        </div>
        <Footer />
      </main>
    </div>
  );
}

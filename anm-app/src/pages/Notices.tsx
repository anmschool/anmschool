import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang, type Lang } from "../i18n";
import { fmtRange, Footer, Head, Icon, useContent, useSeason } from "../ui";
import { IndexLayout } from "./IndexLayout";

type L = Record<Lang, string>;
const ABOUT: { en: string; kr: L; img?: string; verse?: L; ref?: L; body: L[]; info?: L; to?: L }[] = [
  {
    en: "Worship & Praise School", kr: { ko: "경배와찬양학교", en: "Worship & Praise School", zh: "敬拜赞美学校" }, img: "/images/about/2.jpg",
    verse: { ko: "“마음을 다하고 성품을 다하고 힘을 다하여 네 하나님 여호와를 사랑하라”", en: "“You shall love the LORD your God with all your heart and with all your soul and with all your might.”", zh: "“你要尽心、尽性、尽力爱耶和华你的神。”" },
    ref: { ko: "신 6:4–9, 11:13–21", en: "Deut 6:4–9; 11:13–21", zh: "申 6:4–9；11:13–21" },
    body: [
      { ko: "국내와 해외 개척지에서 1년에 두 번, 여름과 겨울에 3박 4일에서 4박 5일간 구별된 장소에서 훈련을 갖습니다. 대학생을 포함한 일반인, 중고등부, 어린이, 예배예술인과 목회자 및 선교사 가정을 위한 경배와찬양학교를 진행합니다.",
        en: "Twice a year, in summer and winter, we hold training of 3 nights/4 days to 4 nights/5 days at a set-apart place, both in Korea and in pioneer fields overseas. Schools are held for general adults including university students, middle and high school students, children, worship artists, and pastors and missionary families.",
        zh: "每年夏季和冬季两次，在国内及海外开拓地分别出来的场所，进行3晚4天至4晚5天的培训。为包括大学生在内的一般成人、初高中生、儿童、敬拜艺术工作者，以及牧者和宣教士家庭举办敬拜赞美学校。" },
      { ko: "첫날 훈련 안내 시간에 경배와찬양학교에 기대하는 기도제목을 적으며 훈련이 시작됩니다. 다음 날 아침 7시 침묵기도로 잠잠히 하나님의 음성을 듣고, 오전 강의와 오후 선택강의·학습활동을 통해 주제 말씀을 듣고 적용합니다.",
        en: "The training begins on the first day as participants write down the prayer requests they hope for during orientation. From 7 a.m. the next morning, silent prayer is a time to listen quietly to God's voice. Through morning lectures, afternoon electives and learning activities, we hear and apply each school's theme verse.",
        zh: "培训从第一天的说明时间开始：写下对敬拜赞美学校所期待的祷告题目。次日早上7点起的静默祷告，是安静聆听神声音的时间。通过上午的讲座、下午的选修课和学习活动，聆听并应用各期学校的主题经文。" },
      { ko: "저녁 집회는 뜨거운 찬양과 기도 속에 성령을 경험하는 시간입니다. 먼저 하나님을 만나고, 삶을 헌신하여 전적으로 하나님의 뜻을 따라 살기로 결정하며, 감추어졌던 쓴 뿌리와 성품, 가정의 기도제목을 가지고 기도하면서 새로운 출발을 시작합니다.",
        en: "The evening meeting is a time to experience the Holy Spirit in passionate worship and prayer. First we meet God; then we dedicate our lives and decide to follow His will completely. Praying over every hidden bitter root, our character and our families' prayer requests, we begin a new start.",
        zh: "晚间聚会是在火热的赞美和祷告中经历圣灵的时间。首先遇见神，然后奉献生命，决定完全遵行神的旨意。并为一切隐藏的苦根、品格和家庭的祷告题目祷告，开始新的出发。" },
    ],
    to: { ko: "2027 WINTER 안내 →", en: "2027 WINTER details →", zh: "2027 WINTER 详情 →" },
  },
  {
    en: "Thursday Worship", kr: { ko: "목요모임", en: "Thursday Worship", zh: "周四聚会" }, img: "/images/about/4.jpg",
    body: [
      { ko: "하나님의 임재를 경험하는 예배, 영적 회복과 치유가 있는 예배, 십자가의 길과 순교자의 삶을 살기로 결단하는 예배.",
        en: "Worship where we experience God's presence; worship with spiritual restoration and healing; worship where we resolve to walk the way of the cross and live the life of a martyr.",
        zh: "经历神同在的敬拜，有属灵恢复与医治的敬拜，决志走十字架之路、过殉道者生活的敬拜。" },
      { ko: "하나님께서는 이 세대에 ‘교회는 선교’임을 깨닫고 하나님의 부르심을 따라갈 수 있는 사람들을 찾고 계십니다. 주님을 위해 생명을 바치겠다는 결단으로 열방을 향해 행진하기 원하는 모든 하나님의 사람들을 주님의 이름으로 경배와찬양 목요모임에 초대합니다.",
        en: "In this generation, God is looking for people who realize that ‘the church is mission’ and can follow His calling. In the name of the Lord, we invite everyone who longs to march toward the nations, resolved to give their lives for Him, to the Worship & Praise Thursday Worship.",
        zh: "神在这个世代寻找明白“教会就是宣教”、能跟随神呼召的人。我们奉主的名，邀请所有愿以为主舍命的决心向万国前进的神的子民，来参加敬拜赞美周四聚会。" },
    ],
    info: { ko: "매주 목요일 오후 7시 · 온누리교회 (오후 5–6시 중보기도로 예배를 준비합니다)",
      en: "Every Thursday, 7:00 PM · Onnuri Church (intercessory prayer from 5 to 6 PM prepares the worship)",
      zh: "每周四下午7:00 · 온누리教会（下午5点至6点以代祷预备敬拜）" },
  },
  {
    en: "7000 Gathering", kr: { ko: "7000모임", en: "7000 Gathering", zh: "7000聚会" },
    body: [
      { ko: "7000모임은 영감예술 시대에 천상의 예배를 드리면서 ‘재헌신’을 하기 위한 경배와찬양의 시대적인 모임입니다.",
        en: "The 7000 Gathering is Worship & Praise's gathering for our times — a place to offer heavenly worship in the age of inspired art and to make a ‘rededication’.",
        zh: "7000聚会是敬拜赞美为这个时代设立的聚会，在灵感艺术的时代献上天上的敬拜，并作“重新奉献”。" },
      { ko: "하나님의 약속의 말씀 학개 2장, 열왕기상 19장, 빌립보서 3장을 통하여 ‘청지기의 삶’과 ‘고난의 축복’ 가운데 살아갈 수 있도록 사명을 주셨습니다. 빛의 갑옷을 입은 7000 청지기들을 통하여 새 예루살렘을 향한 기대감을 가지고 하나님의 선한 뜻을 이루는 통로가 되기를 기도합니다.",
        en: "Through God's promises in Haggai 2, 1 Kings 19 and Philippians 3, He has given us the mission to live in ‘the life of a steward’ and ‘the blessing of suffering’. We pray that the 7000 stewards, clothed in the armor of light, would be channels to fulfill God's good will with anticipation toward the New Jerusalem.",
        zh: "神通过应许的话语——哈该书2章、列王纪上19章、腓立比书3章，赐给我们使命，使我们活在“管家的生命”和“苦难的祝福”之中。愿穿戴光明兵器的7000管家，怀着对新耶路撒冷的期待，成为成就神美好旨意的通道。" },
    ],
    info: { ko: "매주 토요일 오후 4시 · 서빙고 경배와찬양 훈련원 (서울 용산구 서빙고로59길 21-2)",
      en: "Every Saturday, 4:00 PM · Seobinggo Worship & Praise Training Center (21-2 Seobinggo-ro 59-gil, Yongsan-gu, Seoul)",
      zh: "每周六下午4:00 · 西冰库敬拜赞美训练院（首尔龙山区西冰库路59街21-2）" },
  },
  {
    en: "Grand Celebration", kr: { ko: "큰잔치", en: "Grand Celebration", zh: "大聚会" },
    body: [
      { ko: "청년·청소년·어린이와 가정, 지역 교회를 초청해 하나님을 높이는 선교 축제입니다. 나라와 민족을 위해 중보하며 장애인과 함께하는 모임, 성탄절·부활절 큰잔치 등을 이어 왔습니다.",
        en: "A mission festival that exalts God, inviting young adults, teenagers, children, families and local churches. We have interceded for our nation and peoples, and held gatherings with people with disabilities as well as Christmas and Easter celebrations.",
        zh: "邀请青年、青少年、儿童、家庭和地方教会，一同高举神的宣教庆典。我们为国家和民族代祷，并举办了与残障人士同行的聚会，以及圣诞节、复活节大聚会等。" },
    ],
  },
  {
    en: "Regional Ministry", kr: { ko: "지방사역", en: "Regional Ministry", zh: "地方事工" },
    body: [
      { ko: "지역 교회와 캠퍼스의 부흥을 위해 각 도시와 대학에서 특별모임을 갖습니다. 매년 3–6월, 9–11월에 각 지역 헌신자들의 기도와 나눔으로 열립니다.",
        en: "Praying for revival in local churches and campuses, we hold special gatherings in cities and universities. They take place every year from March to June and September to November through the prayer and sharing of local volunteers.",
        zh: "为地方教会和校园的复兴，在各城市和大学举办特别聚会。每年3–6月、9–11月，借着各地奉献者的祷告与分享举行。" },
    ],
  },
  {
    en: "Overseas Ministry", kr: { ko: "해외사역 · 국제학교", en: "Overseas Ministry · International School", zh: "海外事工 · 国际学校" }, img: "/images/about/5.jpg",
    body: [
      { ko: "일본·대만·홍콩을 시작으로 싱가포르, 말레이시아, 몽골, 영국, 미국, 캐나다, 동남아 전역과 인도까지 공산권·모슬렘권·미전도 종족을 향해 나아갑니다. 국제학교와 국제 큰잔치에서는 선교 헌신자를 위한 일주일간의 훈련과 3일간의 선교 큰잔치가 열립니다.",
        en: "Beginning with Japan, Taiwan and Hong Kong, we have gone on to Singapore, Malaysia, Mongolia, the UK, the US, Canada, all of Southeast Asia and India — toward communist nations, Muslim nations and unreached peoples. The International School and International Grand Celebration offer a week of training for mission volunteers followed by a three-day Mission Grand Celebration.",
        zh: "从日本、台湾、香港开始，到新加坡、马来西亚、蒙古、英国、美国、加拿大、东南亚全境以及印度，向共产地区、穆斯林地区和未得之民前进。国际学校与国际大聚会为宣教奉献者举办为期一周的培训，以及三天的宣教大聚会。" },
    ],
  },
];

export default function Notices() {
  const { content } = useContent();
  const s = useSeason();
  const { t, lang } = useLang();
  const loc = useLocation();
  const others = (content?.projects ?? []).filter(p => p.id !== s?.id && p.id !== "매주예배");

  useEffect(() => {
    if (loc.hash === "#ministries") document.getElementById("ministries")?.scrollIntoView({ behavior: "smooth" });
  }, [loc.hash, content]);

  return (
    <div className="app">
      <Head label="Notices & Ministries" title={t("noticesMinistries")} />
      <main className="body guide-body">
        <div id="ministries">
          <IndexLayout items={[...ABOUT.map((m, i) => ({ id: `m${i}`, title: m.kr[lang] })), ...(others.length ? [{ id: "others", title: t("otherMinistries") }] : [])]}>
            {ABOUT.map((m, i) => (
              <article key={m.en} id={`m${i}`} className="min-about gitem">
                <span className="label">{m.en}</span>
                <h3>{m.kr[lang]}</h3>
                {m.img && <img className="min-img" src={m.img} alt="" loading="lazy" />}
                {m.verse && m.ref && <p className="verse">{m.verse[lang]}<span className="ref">{m.ref[lang]}</span></p>}
                {m.body?.map((x, j) => <p key={j}>{x[lang]}</p>)}
                {m.info && <p className="info">{m.info[lang]}</p>}
                {m.to && <Link to="/" className="more">{m.to[lang]}</Link>}
              </article>
            ))}
            {others.length > 0 && (
              <section id="others" className="gitem">
                <h3>{t("otherMinistries")}</h3>
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
              </section>
            )}
          </IndexLayout>
        </div>
        <Footer />
      </main>
    </div>
  );
}

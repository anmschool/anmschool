import type { Lang } from "./i18n";
type L = Record<Lang, string>;

/** 2027 WINTER 주제·말씀·초대의 글 (시트 부제보다 우선) */
export const THEME_2027W: { title: L; verse: L; ref: L; invite: L[]; sign: L[] } = {
  title: { ko: "얽매이지 않는 삶 - 믿음의 경주", en: "An Unbound Life — The Race of Faith", zh: "不被辖制的生活 — 信心的赛程" },
  verse: {
    ko: "“… 모든 무거운 것과 얽매이기 쉬운 죄를 벗어 버리고 …”",
    en: "“… let us throw off everything that hinders and the sin that so easily entangles …”",
    zh: "“……就当放下各样的重担，脱去容易缠累我们的罪……”",
  },
  ref: { ko: "히 12:1", en: "Hebrews 12:1", zh: "希伯来书 12:1" },
  invite: [
    {
      ko: "경배와찬양을 통하여 ‘새 예루살렘을 향한 복음’을 선포케 하신 주님을 높여 드립니다. 자기 생활에 얽매이지 않고(딤후 2:4), 모든 무거운 것과 얽매이기 쉬운 죄를 벗어 버리고(히 12:1) 믿음의 경주를 하게 하신 주님을 사랑합니다.",
      en: "We exalt the Lord who has called us to proclaim “the gospel toward the New Jerusalem” through worship and praise. We love the Lord who keeps us from being entangled in civilian affairs (2 Tim 2:4) and lets us throw off everything that hinders and the sin that so easily entangles (Heb 12:1), so that we may run the race of faith.",
      zh: "我们高举藉着敬拜赞美使我们宣扬“向着新耶路撒冷的福音”的主。我们爱主，祂使我们不被世务缠身（提后 2:4），放下各样的重担，脱去容易缠累我们的罪（来 12:1），奔那信心的赛程。",
    },
    {
      ko: "바울은 복음 때문에 갇혔지만, 복음은 매이지 않았습니다(딤후 2:9). 이제는 삶의 복음을 전하기를 사모합니다. 감동을 주는 삶을 통하여 예수 그리스도의 복음의 비밀을 함께 체험하기를 원합니다. 모든 것이 가하나, 다 유익한 것은 아닙니다. 무엇에든지 얽매이지 않기를(고전 6:12) 소원합니다.",
      en: "Paul was chained because of the gospel, but the gospel was not chained (2 Tim 2:9). Now we long to share the gospel of our lives. Through lives that move others, we desire to experience together the mystery of the gospel of Jesus Christ. Everything is permissible, but not everything is beneficial; we desire not to be mastered by anything (1 Cor 6:12).",
      zh: "保罗为福音被捆锁，但福音却不被捆绑（提后 2:9）。如今我们渴望传扬生命的福音，盼望藉着感动人心的生命，一同经历耶稣基督福音的奥秘。凡事都可行，但不都有益处；无论哪一件，我们都愿不受它的辖制（林前 6:12）。",
    },
    {
      ko: "이제 얽매이지 않는 삶의 비밀을 이번 경배와찬양학교를 통하여 함께 체험하기를 사모하는 모든 청지기 형제자매들을 초대합니다.",
      en: "We now invite all stewards, brothers and sisters, who long to experience together the secret of an unbound life through this Worship & Praise School.",
      zh: "现在，我们邀请所有渴望藉着这次敬拜赞美学校，一同经历不被辖制之生命奥秘的众管家弟兄姊妹。",
    },
  ],
  sign: [
    { ko: "올네이션스 경배와찬양", en: "All Nations Worship & Praise Ministries", zh: "万国敬拜赞美事工" },
    { ko: "International Mentor", en: "International Mentor", zh: "International Mentor" },
    { ko: "하스데반", en: "Stephen Ha", zh: "Stephen Ha（하스데반）" },
  ],
};

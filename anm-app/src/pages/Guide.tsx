import { useLang } from "../i18n";
import { Footer, Head, RichText, useContent, useSeason } from "../ui";
import { IndexLayout } from "./IndexLayout";

/** 안내: 모두 펼쳐 두고, 목차(컴퓨터 왼쪽 · 폰 위쪽)로 이동 */
export default function Guide() {
  const { content } = useContent();
  const s = useSeason();
  const { t } = useLang();
  const guides = (content?.guides ?? []).filter(g => g.project === s?.id).map((g, i) => ({ ...g, id: `g${i}` }));
  const sections = Array.from(new Set(guides.map(g => g.section)));

  return (
    <div className="app">
      <Head label="Guide" title={t("guide")} />
      <main className="body guide-body">
        {guides.length === 0 && <div className="empty">{t("comingSoon")}</div>}
        {guides.length > 0 && (
          <IndexLayout items={guides.map(g => ({ id: g.id, title: g.title, group: g.section }))}>
            {sections.map(sec => (
              <section key={sec} className="gsec">
                <h2>{sec}</h2>
                {guides.filter(g => g.section === sec).map(g => (
                  <div key={g.id} id={g.id} className="gitem"><h3>{g.title}</h3><RichText text={g.body} /></div>
                ))}
              </section>
            ))}
          </IndexLayout>
        )}
        <Footer />
      </main>
    </div>
  );
}

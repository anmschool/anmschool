import { useLang } from "../i18n";
import { Footer, Head, RichText, Section, useContent, useSeason } from "../ui";

export default function Guide() {
  const { content } = useContent();
  const s = useSeason();
  const { t } = useLang();
  const guides = (content?.guides ?? []).filter(g => g.project === s?.id);
  const sections = Array.from(new Set(guides.map(g => g.section)));
  return (
    <div className="app">
      <Head label="Guide" title={t("guide")} />
      <main className="body">
        {guides.length === 0 && <div className="empty">{t("comingSoon")}</div>}
        {sections.map(sec => (
          <Section key={sec} title={sec}>
            <div>{guides.filter(g => g.section === sec).map(g => (
              <details key={g.title} className="acc"><summary>{g.title}</summary><RichText text={g.body} /></details>
            ))}</div>
          </Section>
        ))}
        <Footer />
      </main>
    </div>
  );
}

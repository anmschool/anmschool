import { useLang } from "../i18n";
import { THEME_2027W as T } from "../theme2027W";
import { Footer, Head } from "../ui";

/** 초대의 글: 주제 말씀 + 서문 (홈에서 분리) */
export default function Invitation() {
  const { t, lang } = useLang();
  return (
    <div className="app">
      <Head label="Invitation" title={t("invitation")} />
      <main className="body">
        <section className="invite" lang={lang}>
          <h2 className="invite-t">‘{T.title[lang]}’</h2>
          <p className="invite-v">{T.verse[lang]} <span>({T.ref[lang]})</span></p>
          {T.invite.map((x, i) => <p key={i}>{x[lang]}</p>)}
          <p className="invite-s">{T.sign.map((x, i) => <span key={i}>{x[lang]}</span>)}</p>
        </section>
        <Footer />
      </main>
    </div>
  );
}

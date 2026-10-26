import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DEMO, ERROR_TEXT, getToken, login } from "../api";
import { useLang } from "../i18n";
import { Footer, useProject, Wash } from "../ui";

export default function Login() {
  const { id = "" } = useParams();
  const p = useProject(id);
  const { t } = useLang();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (getToken(id)) return <Navigate to={`/p/${id}/me`} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const digits = phone.replace(/\D/g, "");
    if (!name.trim() || digits.length < 9) { setErr(ERROR_TEXT.invalid_input); return; }
    setBusy(true);
    try {
      const r = await login(id, name, digits);
      if (r.ok) nav(`/p/${id}/me`, { replace: true });
      else setErr(ERROR_TEXT[r.error] ?? ERROR_TEXT.server);
    } catch { setErr(ERROR_TEXT.network); }
    finally { setBusy(false); }
  };

  return (
    <main className="page">
      <Wash project={p} back={`/p/${id}`}>
        <span className="label wine">{p?.title ?? id}</span>
        <h1 style={{ marginTop: 6 }}>{t("loginTitle")}</h1>
        <p className="lede">{t("loginLede")}</p>
      </Wash>
      <form className="stack" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="nm">{t("name")}</label>
          <input id="nm" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" />
        </div>
        <div className="field">
          <label htmlFor="ph">{t("phone")}</label>
          <input id="ph" inputMode="numeric" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010 1234 5678" />
          <p className="hint">{t("phoneHint")}</p>
        </div>
        {err && <div className="error" role="alert">{err}</div>}
        <button className="btn" type="submit" disabled={busy}>{busy ? t("checking") : t("enter")}</button>
        {DEMO && <div className="note">데모 모드: 홍길동 / 010-1234-5678</div>}
      </form>
      <Footer />
    </main>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { DEMO, ERROR_TEXT, getToken, login, warmUp } from "../api";
import { useLang } from "../i18n";
import { Footer, Head, Skeleton, useSeason } from "../ui";

export default function Login() {
  const s = useSeason();
  const { t } = useLang();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { warmUp(); }, []);

  if (!s) return <div className="app"><Head title={t("loginTitle")} /><main className="body"><Skeleton /></main></div>;
  if (getToken(s.id)) return <Navigate to="/me" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const digits = phone.replace(/\D/g, "");
    if (!name.trim() || digits.length < 9) { setErr(ERROR_TEXT.invalid_input); return; }
    setBusy(true);
    try {
      const r = await login(s.id, name, digits);
      if (r.ok) nav("/me", { replace: true });
      else setErr(ERROR_TEXT[r.error] ?? ERROR_TEXT.server);
    } catch { setErr(ERROR_TEXT.network); }
    finally { setBusy(false); }
  };

  return (
    <div className="app">
      <Head label="My Page" title={t("loginTitle")} />
      <main className="body">
        <p className="sub" style={{ margin: 0 }}>{t("loginLede")}</p>
        <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div className="field">
            <label htmlFor="nm">Name · {t("name")}</label>
            <input id="nm" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" />
          </div>
          <div className="field">
            <label htmlFor="ph">Phone · {t("phone")}</label>
            <input id="ph" inputMode="numeric" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010 1234 5678" />
            <span className="small">{t("phoneHint")}</span>
          </div>
          {err && <div className="error" role="alert">{err}</div>}
          <button className="btn" type="submit" disabled={busy}>{busy ? t("checking") : t("enter")}</button>
          {DEMO && <div className="note">데모 모드 — 홍길동 / 010-1234-5678</div>}
        </form>
        <Footer />
      </main>
    </div>
  );
}

#!/usr/bin/env node
/**
 * 시즌 세팅 도구 — season.json(디자인 엔진과 같은 파일) 하나로 앱을 새 시즌으로 바꾼다.
 *
 *   node tools/season-sync.mjs <season.json> [포스터배경.png|jpg] [--app-title "새 예루살렘을 향한 경배와찬양학교 및 7000학교"] [--dry]
 *
 * 하는 일
 *   1) 'ANM 앱' 관리 시트(anmschool 소유)에 반영 — Apps Script 웹앱의 apply API로 보냄 (실행은 anmschool)
 *      · 프로젝트: 시즌 줄 추가/수정, 이전 시즌(진행 중인 경배와찬양학교)은 '종료'
 *      · 안내: 훈련 안내 · 훈련비 · 환불 규정 · 문의를 season.json에서 다시 채움
 *   2) 포스터 배경을 앱 이미지로 (anm-app/public/images/seasons/<시즌코드>.jpg, 1600px JPEG)
 *   3) git commit (작성자 anmschool) + push → Vercel 자동 배포
 *
 * 설정: ~/.anm/admin.json  {"api": "<Apps Script 웹앱 URL>", "key": "<showAdminKey로 본 ADMIN_KEY>"}
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const DRY = args.includes("--dry"); if (DRY) args.splice(args.indexOf("--dry"), 1);
const appTitleArg = flag("--app-title");
const [seasonPath, imagePath] = args;
if (!seasonPath) { console.error("사용법: node tools/season-sync.mjs <season.json> [배경이미지] [--app-title …] [--dry]"); process.exit(1); }

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const S = JSON.parse(fs.readFileSync(seasonPath, "utf8"));
const C = S.content ?? S;

/* ── season.json → 앱 데이터 ── */
const m = String(C.season || "").match(/(\d{4})\s*(WINTER|SUMMER|Winter|Summer|W|S)/);
if (!m) throw new Error('season.json content.season 이 "2027 WINTER" 형식이 아님');
const CODE = m[1] + (/^w/i.test(m[2]) ? "W" : "S");
const SEASON_UP = `${m[1]} ${/^w/i.test(m[2]) ? "WINTER" : "SUMMER"}`;
const appTitle = appTitleArg || C.appTitle || C.title;

// 트랙 날짜 문자열 → 전체 시작·끝 ("2027년 1월 11일(월) - 14일(목)", "… - 16일(토) / 18일(월) - 21일(목)")
function range(tracks) {
  const ds = [];
  for (const t of tracks || []) {
    const y = (t.date.match(/(\d{4})년/) || [])[1]; const mo = (t.date.match(/(\d{1,2})월/) || [])[1];
    if (!y || !mo) continue;
    for (const d of t.date.matchAll(/(\d{1,2})일/g)) ds.push(`${y}-${mo.padStart(2, "0")}-${d[1].padStart(2, "0")}`);
  }
  ds.sort();
  return [ds[0] || "", ds[ds.length - 1] || ""];
}
const [start, end] = range(C.tracks);

const project = {
  ID: CODE, 종류: "경배와찬양학교", 제목: `${SEASON_UP} ${appTitle}`,
  부제: C.theme?.text ? `${C.theme.text}${C.theme.ref ? ` (${C.theme.ref})` : ""}` : "",
  시작일: start, 종료일: end, 장소: C.venue?.name || "", 상태: "진행", 순서: 1,
  "신청 링크": C.apply?.link || "", 로그인: "ON", 색: "#6E1F3A",
  소개: [String(C.leaders || "").replace(/\s*\n\s*/g, " ").replace(/^.*?학교는\s*/, ""), (C.tracks || []).map(t => `${t.title.replace(/를 위한 경배와찬양학교.*/, "")} ${t.short || ""}`).join(" · ")].filter(Boolean).join(" "),
};
let imageRel = null;
if (imagePath) { imageRel = `/images/seasons/${CODE}.jpg`; project["대표 이미지"] = imageRel; }

const guides = [];
let order = 1;
const bullet = (arr) => arr.map(x => `- ${x}`).join("\n");
for (const [head, items] of C.guide || []) {
  if (!items?.length) continue;   // 한 줄짜리 소개 문장은 건너뜀
  guides.push({ 프로젝트ID: CODE, 섹션: "훈련 안내", 제목: head.replace(/^'|'$/g, "").replace(/[‘’']/g, ""), 내용: bullet(items), 순서: order++ });
}
for (const t of C.tracks || []) {
  const f = t.fee; if (!f) continue;
  const lines = [];
  if (f.type === 3) for (const r of f.rows) lines.push(`${r[0]}: ${C.feeHead3?.[1] || "일반인·대학청년"} ${r[1]} / ${C.feeHead3?.[2] || "십대"} ${r[2]} / ${C.feeHead3?.[3] || "어린이"} ${r[3]}`);
  else if (f.type === 2) lines.push(`선등록 ${f.rows[1][0]} (${f.rows[0][0]}) / 일반등록 ${f.rows[1][1]} (${f.rows[0][1]})`);
  if (t.online) lines.push(`온라인 ${t.online}`);
  if (f.account) lines.push(`계좌: ${f.account}`);
  guides.push({ 프로젝트ID: CODE, 섹션: "훈련비", 제목: `${t.title.replace(/를 위한 경배와찬양학교.*/, "")} ${t.nights ? `(${t.nights})` : ""}`.trim(), 내용: bullet(lines), 순서: order++ });
}
if (C.refund) guides.push({ 프로젝트ID: CODE, 섹션: "훈련비", 제목: "환불 규정", 내용: bullet([C.refund.full, C.refund.half, C.refund.none].filter(Boolean)) + (C.refund.note ? "\n" + C.refund.note.replace(/\n/g, " ") : ""), 순서: order++ });
if (C.contact) guides.push({ 프로젝트ID: CODE, 섹션: "문의", 제목: "연락처", 내용: bullet(C.contact.filter(c => ["mail", "phone", "home"].includes(c[0])).map(c => c[1])), 순서: order++ });

const ops = [
  { op: "upsert", tab: "프로젝트", keys: ["ID"], rows: [project] },
  { op: "update", tab: "프로젝트", where: { 종류: "경배와찬양학교", 상태: "진행" }, except: { ID: CODE }, set: { 상태: "종료" } },
  { op: "replace", tab: "안내", where: { 프로젝트ID: CODE }, rows: guides },
];

console.log(`▶ 시즌 ${CODE} — ${project.제목}`);
console.log(`  기간 ${start} ~ ${end} · 장소 ${project.장소} · 안내 ${guides.length}개${imageRel ? ` · 배경 ${imageRel}` : ""}`);
if (DRY) { console.log(JSON.stringify(ops, null, 2)); process.exit(0); }

/* ── 1) 관리 시트 반영 (Apps Script = anmschool로 실행) ── */
const cfgPath = path.join(os.homedir(), ".anm", "admin.json");
if (!fs.existsSync(cfgPath)) { console.error("✖ ~/.anm/admin.json 이 없음 — Apps Script에서 showAdminKey 실행 후 다시"); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const DEFAULT_API = "https://script.google.com/macros/s/AKfycbx0Ax91iMfBomb-KHNsf88DrHm9t3qpMLm-ng8QUYANxwkMmDF9kU6haQlJmm5rgXYx/exec";
const API = cfg.api && /\/exec$/.test(cfg.api) ? cfg.api : DEFAULT_API;
const res = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "apply", key: cfg.key, ops }), redirect: "follow" });
const out = await res.json();
if (!out.ok) { console.error("✖ 관리 시트 반영 실패:", out); process.exit(1); }
for (const r of out.report) console.log(`  ✔ ${r.tab} ${r.op}: 추가 ${r.added} · 수정 ${r.changed} · 삭제 ${r.removed}`);

/* ── 2) 배경 이미지 ── */
if (imagePath) {
  const dest = path.join(REPO, "anm-app", "public", "images", "seasons", `${CODE}.jpg`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  execFileSync("sips", ["-Z", "1600", "-s", "format", "jpeg", "-s", "formatOptions", "82", imagePath, "--out", dest], { stdio: "ignore" });
  console.log(`  ✔ 배경 이미지 → ${path.relative(REPO, dest)}`);
  /* ── 3) git push → Vercel ── */
  const git = (...a) => execFileSync("git", ["-C", REPO, ...a], { stdio: "pipe" }).toString().trim();
  git("add", dest);
  if (git("status", "--porcelain")) {
    git("commit", "-m", `시즌 ${CODE} 배경 이미지`);
    git("push", "-q", "origin", "main");
    console.log("  ✔ GitHub push → Vercel 자동 배포");
  }
}
console.log("✅ 끝. 앱에 바로 반영됩니다 (이미지는 1~2분 뒤).");
